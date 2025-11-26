package io.github.vudsen.spectre.core.util

import org.springframework.http.client.SimpleClientHttpRequestFactory
import java.io.IOException
import java.net.HttpURLConnection
import java.net.InetAddress
import java.net.Socket
import java.security.SecureRandom
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLSocket
import javax.net.ssl.SSLSocketFactory
import javax.net.ssl.TrustManager

/**
 * 配合 [org.springframework.web.client.RestClient]使用，忽略 SSL 校验
 */
object InsecureRequestFactory : SimpleClientHttpRequestFactory() {

    const val SSL_VERSION = "TLSv1.2"

    override fun prepareConnection(connection: HttpURLConnection, httpMethod: String) {
        try {
            if (connection !is HttpsURLConnection) {
                throw RuntimeException("An instance of HttpsURLConnection is expected")
            }

            val httpsConnection = connection

            val trustAllCerts: Array<TrustManager> = arrayOf(TrustAllX509TrustManager)
            val sslContext: SSLContext = SSLContext.getInstance(SSL_VERSION)
            sslContext.init(null, trustAllCerts, SecureRandom())
            httpsConnection.setSSLSocketFactory(MyCustomSSLSocketFactory(sslContext.getSocketFactory()))

            httpsConnection.setHostnameVerifier(TrustAnyHostnameVerifier)

            super.prepareConnection(httpsConnection, httpMethod)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * We need to invoke sslSocket.setEnabledProtocols(new String[] {"SSLv3"});
     */
    class MyCustomSSLSocketFactory(private val delegate: SSLSocketFactory) : SSLSocketFactory() {
        override fun getDefaultCipherSuites(): Array<String?>? {
            return delegate.getDefaultCipherSuites()
        }

        override fun getSupportedCipherSuites(): Array<String?>? {
            return delegate.getSupportedCipherSuites()
        }

        @Throws(IOException::class)
        public override fun createSocket(socket: Socket?, host: String?, port: Int, autoClose: Boolean): Socket {
            val underlyingSocket: Socket = delegate.createSocket(socket, host, port, autoClose)
            return overrideProtocol(underlyingSocket)
        }

        @Throws(IOException::class)
        override fun createSocket(host: String?, port: Int): Socket {
            val underlyingSocket: Socket = delegate.createSocket(host, port)
            return overrideProtocol(underlyingSocket)
        }

        @Throws(IOException::class)
        override fun createSocket(host: String?, port: Int, localAddress: InetAddress?, localPort: Int): Socket {
            val underlyingSocket: Socket = delegate.createSocket(host, port, localAddress, localPort)
            return overrideProtocol(underlyingSocket)
        }

        @Throws(IOException::class)
        override fun createSocket(host: InetAddress?, port: Int): Socket {
            val underlyingSocket: Socket = delegate.createSocket(host, port)
            return overrideProtocol(underlyingSocket)
        }

        @Throws(IOException::class)
        override fun createSocket(host: InetAddress?, port: Int, localAddress: InetAddress?, localPort: Int): Socket {
            val underlyingSocket: Socket = delegate.createSocket(host, port, localAddress, localPort)
            return overrideProtocol(underlyingSocket)
        }

        fun overrideProtocol(socket: Socket): Socket {
            if (socket !is SSLSocket) {
                throw RuntimeException("An instance of SSLSocket is expected")
            }
            socket.setEnabledProtocols(arrayOf(SSL_VERSION))
            return socket
        }
    }


}