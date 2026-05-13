#FROM eclipse-temurin:11.0.31_11-jre-ubi10-minimal
#FROM eclipse-temurin:8u492-b09-jre-ubi9-minimal
#FROM eclipse-temurin:17.0.17_10-jre-noble
#FROM eclipse-temurin:25.0.3_9-jre-ubi10-minimal
FROM eclipse-temurin:8-jre

WORKDIR /opt
ADD math-game.jar /opt/math-game.jar

CMD ["java", "-jar", "math-game.jar"]