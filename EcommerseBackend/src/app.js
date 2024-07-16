import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express ()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: '16kb'}))
app.use(express.urlencoded({extened: true, limit : "16kb"}))
app.use(express.static('public'))
app.use(cookieParser())

//routes
import userRouter from './routes/user.routes.js'
import sellerRouter from './routes/seller.routes.js'
import AdminRouter from './routes/admin.routes.js'




//routes declaration
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