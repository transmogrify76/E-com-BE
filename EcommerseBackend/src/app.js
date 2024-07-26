import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
<<<<<<< Updated upstream
import path from "path"
=======
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger-output.json' assert { type: 'json' };
>>>>>>> Stashed changes

const app = express ()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use(express.json({limit: '16kb'}))
app.use(express.urlencoded({extened: true, limit : "16kb"}))
app.use(express.static('public'))
app.use(cookieParser())

//routes
import userRouter from './routes/user.routes.js'
import sellerRouter from './routes/seller.routes.js'
import AdminRouter from './routes/admin.routes.js'

<<<<<<< Updated upstream
//temp image upload logic
import multer from 'multer';

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to the original filename
    }
});

// Initialize multer with the storage configuration
const upload = multer({ storage });

// Create an endpoint for uploading images
app.post('/images/uploads', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.status(200).send({
        message: 'File uploaded successfully',
        file: req.file
    });
});

=======
// Define a route for the root URL
app.get('/', (req, res) => {
    res.send('Hello World!');
});
>>>>>>> Stashed changes


//routes declaration
// app.use("/" , alert("hello"))
app.use("/users", userRouter)
app.use("/sellers", sellerRouter)
app.use("/admins", AdminRouter)

//user side authentication
//http://localhost:8000/users/register
//http://localhost:8000/users/register
//http://localhost:3000/users/logout

//seller side authentication
//http://localhost:8000/sellers/registerSeller
//http://localhost:8000/sellers/loginSeller

export { app }