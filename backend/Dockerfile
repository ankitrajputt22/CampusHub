FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /workspace

COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -q -DskipTests=false package

FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S campushub && adduser -S campushub -G campushub

WORKDIR /app

COPY --from=build /workspace/target/*.jar /app/campus-hub-backend.jar

USER campushub

EXPOSE 8080

ENV JAVA_OPTS=""

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/campus-hub-backend.jar"]
