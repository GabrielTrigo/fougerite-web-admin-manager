FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["FougeriteAdminBridge.API.csproj", "./"]
RUN dotnet restore "FougeriteAdminBridge.API.csproj"

COPY . .
RUN dotnet build "FougeriteAdminBridge.API.csproj" -c Release -o /app/build
RUN dotnet publish "FougeriteAdminBridge.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .

# Criação do diretório para persistência do banco SQLite
RUN mkdir -p /app/data && chown -R $APP_UID:$APP_UID /app/data
USER $APP_UID

ENTRYPOINT ["dotnet", "FougeriteAdminBridge.API.dll"]
