FROM eclipse-temurin:17.0.17_10-jre-noble

RUN useradd -r -u 10001 spectre
USER 10001

ENV SPECTRE_HOME=/home/spectre
WORKDIR /home/spectre

COPY spectre.jar /home/spectre/spectre.jar

CMD ["java", "-jar", "spectre.jar"]
