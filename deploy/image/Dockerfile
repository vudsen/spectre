FROM eclipse-temurin:17.0.17_10-jre-noble

RUN useradd -m spectre
USER spectre
WORKDIR /home/spectre

COPY spectre.jar /home/spectre/spectre.jar

CMD ["java", "-jar", "spectre.jar"]
