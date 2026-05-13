FROM eclipse-temurin:8-jre-alpine-3.23 as base
#FROM eclipse-temurin:11.0.31_11-jre-alpine-3.23 as base
#FROM eclipse-temurin:17-jre-alpine-3.23 as base
#FROM eclipse-temurin:25-jre-alpine-3.23 as base


FROM testcontainers/sshd:1.3.0

ENV JAVA_HOME=/opt/java/openjdk
ENV USERNAME=root
ENV PASSWORD=P@ssw0rd
EXPOSE 22

COPY math-game.jar /opt/math-game.jar
COPY --from=base $JAVA_HOME $JAVA_HOME
COPY startup.sh /opt/startup.sh
CMD ["/opt/startup.sh"]
