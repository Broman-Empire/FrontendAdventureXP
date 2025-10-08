# nginx: webserver til at vise filer, alpine: mini Linux image
FROM nginx:alpine
# Arbejdsmappen i containeren
WORKDIR /usr/share/nginx/html
# Kopierer alle filer fra frontend projektet
COPY . .
# Fortæller Docker at containeren lytter på port 80 (standardport HTTP)
EXPOSE 80
# Kommando der kører, når container startes. Daemon off: kører container i forgrunden
CMD ["nginx", "-g", "daemon off;"]
