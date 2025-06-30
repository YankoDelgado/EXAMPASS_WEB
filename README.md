# Brief_ExamPass

## Tecnologías utilizadas
- React-Vite
- Node.js-Express
- PostgreSQL
- Prisma ORM
- bcrypt
- jsonwebtoken

## Justificación de librerías utilizadas
- Se utiliza bcrypt para aplicar hashing seguro a las contraseñas de los usuarios, siguiendo buenas prácticas de seguridad. De esta forma, las contraseñas no se almacenan en texto plano.
- Se utiliza jsonwebtoken para generar tokens de autenticación JWT, permitiendo proteger rutas y mantener sesiones sin necesidad de usar cookies o almacenamiento en servidor.

## Cómo ejecutar el proyecto en local

### 1. Clona el repositorio

```bash
git clone https://github.com/tu_usuario/Brief_ExamPass.git
cd Brief_ExamPass
```
### 2. Configura las variables de entorno
Crea un archivo .env en la raíz del backend con el siguiente contenido (ajusta los datos según tu configuración local):
```bash
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/nombre_de_tu_base"
JWT_SECRET="clave_secreta_para_tokens"
PORT=3000
NODE_ENV=development
```
### 3. Instala dependencias
Te ubicas donde se encuentre el proyecto para instalar las dependencias necesarias.
```bash
npm install
```

### 4. Configura la base de datos
luego dentro de la misma dirección se ejecuta lo siguiente:
```bash
npx prisma generate
npx prisma migrate dev --name init
```
Esto generará las tablas en tu base de datos y el cliente de Prisma.

### 5. Levanta el serevidor
```bash
node src/server.js
```
### 6. Levanta React 
En otra terminal coloca el siguientee comando para iniciar React
```bash
npm run dev
```
La app debería estar disponible en: http://localhost:5173
