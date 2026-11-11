FROM eclipse-temurin:21-jre
WORKDIR /app

ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} /app/app.jar
EXPOSE 8088

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
