package io.github.vudsen.spectre.core.audit

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.vudsen.spectre.core.integrate.UserWithID
import io.github.vudsen.spectre.repo.LogEntityRepository
import io.github.vudsen.spectre.repo.po.LogEntityPO
import org.aspectj.lang.ProceedingJoinPoint
import org.aspectj.lang.annotation.Around
import org.aspectj.lang.annotation.Aspect
import org.aspectj.lang.annotation.Pointcut
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.core.task.TaskExecutor
import org.springframework.expression.spel.standard.SpelExpression
import org.springframework.expression.spel.standard.SpelExpressionParser
import org.springframework.expression.spel.support.StandardEvaluationContext
import org.springframework.http.HttpHeaders
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import java.sql.Timestamp
import java.util.WeakHashMap

@Aspect
@Component
class LogAspect(
    @param:Qualifier("applicationTaskExecutor") private val executor: TaskExecutor
) {

    private lateinit var logEntityRepository: LogEntityRepository


    @Autowired
    fun setLogEntityRepository(logEntityRepository: LogEntityRepository) {
        this.logEntityRepository = logEntityRepository
    }

    companion object {
        /**
         * 返回值
         */
        const val SPEL_VARIABLE_RETURN_OBJ = "returnObj"
        /**
         * 当前入参
         */
        const val SPEL_VARIABLE_ARGS = "args"
        val logger = LoggerFactory.getLogger(LogAspect::class.java)
        private val objectMapper = ObjectMapper()
    }

    /**
     * SpEL 根对象，可以直接调用对应的方法
     */
    object LogRootObject {

        fun pickAttributes(target: Any, vararg attributes: String): Map<String, Any?> {
            return buildMap {
                for (attr in attributes) {
                    val field = target.javaClass.getDeclaredField(attr)
                    field.isAccessible = true
                    put(attr, field.get(target))
                }
            }
        }
    }

    @Pointcut("@annotation(logAnnotation)")
    fun webLog(logAnnotation: Log) {
    }

    private val expressionCache = WeakHashMap<String, SpelExpression>()

    private val spelParser = SpelExpressionParser()

    @Around("webLog(logAnnotation)")
    @Throws(Throwable::class)
    fun around(joinPoint: ProceedingJoinPoint, logAnnotation: Log): Any? {
        val logEntity = createBaseLogEntity(logAnnotation)

        var exp: Exception? = null
        var returnObj: Any? = null
        try {
            // 处理修改密码导致退出后，拿不到用户信息的问题
            tryFillUserInfo(logEntity, null)
            returnObj = joinPoint.proceed()
            return returnObj
        } catch (e: Exception) {
            exp = e
            throw e
        } finally {
            executor.execute {
                val context = resolveContext(logAnnotation, returnObj, joinPoint)
                if (logEntity.username == null) {
                    tryFillUserInfo(logEntity, context)
                }
                try {
                    logEntity.context = objectMapper.writeValueAsString(context)
                    if (exp == null) {
                        logEntity.isSuccess = true
                    } else {
                        logEntity.isSuccess = false
                        logEntity.message = exp.message
                    }
                    logEntityRepository.save(logEntity)
                } catch (e: Exception) {
                    logger.error("Failed to save log", e)
                }
            }
        }
    }

    private fun resolveContext(
        logAnnotation: Log,
        result: Any?,
        joinPoint: ProceedingJoinPoint,
    ): Map<String, *>? {
        if (logAnnotation.contextResolveExp == "null") {
            return null
        }
        val expression = expressionCache.compute(logAnnotation.contextResolveExp) { k, v ->
            if (v == null) {
                return@compute spelParser.parseRaw(k)
            }
            return@compute v
        }!!
        val evaluationContext = StandardEvaluationContext()
        evaluationContext.setVariable(SPEL_VARIABLE_RETURN_OBJ, result)
        evaluationContext.setVariable(SPEL_VARIABLE_ARGS, joinPoint.args)
        evaluationContext.setRootObject(LogRootObject)
        try {
            return expression.getValue(evaluationContext, Map::class.java) as Map<String, *>?
        } catch (e: Exception) {
            logger.error("Failed to resolve context for method {}", joinPoint.signature.declaringTypeName, e)
            return mapOf(Pair("error", e.message))
        }
    }

    /**
     * 尝试填充用户上下文
     * @param context 从注解获取的上下文，当用户没登录时，会使用里面的 username 值
     */
    private fun tryFillUserInfo(logEntity: LogEntityPO, context: Map<String, *>?) {
        SecurityContextHolder.getContext().authentication?.principal?.let {
            if (it is UserWithID) {
                logEntity.username = it.username
                logEntity.userId = it.id
            }
        }
        if (logEntity.username.isEmpty() && context != null) {
            val un = context["username"]
            if (un is String) {
                logEntity.username = un
                logEntity.userId = -1
            }
        }
    }

    private fun createBaseLogEntity(logAnnotation: Log): LogEntityPO {
        val logEntity = LogEntityPO()
        logEntity.time = Timestamp(System.currentTimeMillis())

        val request = (RequestContextHolder.currentRequestAttributes() as ServletRequestAttributes).request
        logEntity.userAgent = request.getHeader(HttpHeaders.USER_AGENT) ?: "<Unknown>"
        logEntity.operation = logAnnotation.messageKey

        logEntity.ip = request.getHeader("X-Forwarded-For")?.split(",")?.firstOrNull()?.trim()
            ?: request.getHeader("X-Real-IP")?.trim()
            ?: request.remoteAddr
        return logEntity
    }


}