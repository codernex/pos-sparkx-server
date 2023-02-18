import "reflect-metadata";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, {Application, Request, Response} from 'express';
import config from './config';
import errorMiddleware from './middleware/err';
import {commonAuth, isAuth, isSuperAdmin} from './middleware/isAuth';
import authRoute from './routes/auth';
import barcodeRoutes from './routes/barcode';
import brandRoutes from './routes/brand';
import productRoutes from './routes/product';
import showroomRoutes from './routes/showroom';
import supplierRoutes from './routes/supplier';
import userRouter from './routes/user';
import warehouseRoutes from './routes/warehouse';
import dataSource from './typeorm.config';
import invoiceRoutes from "./routes/invoice";

import {showRoomAccess} from "./middleware/showroom";
import customerRoutes from "./routes/customer";
import http from "http";
import Server from "socket.io";
import employeeRoutes from "./routes/employee";
import taxRoutes from "./routes/tax";
import seedRoutes from "./routes/seed";
import businessRoutes from "./routes/business";
import reports from "./routes/reports";
import expense from "./routes/expense";

const mount = async (app: Application) => {
    const server = new http.Server(app)
    const io = new Server.Server(server)
    const whiteList = [
        'http://localhost:3002',
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        'http://sparkxpos.btamsbd.com',
        'https://sparkxpos.btamsbd.com',
        'http://beta.sparkx.com.bd',
        'https://beta.sparkx.com.bd',
    ];

    app.use(
        cors({
            origin: (origin, callback) => {
                if (origin && whiteList.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(null, false);
                }
            },
            credentials: true
        })
    );
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({extended: true, limit: '100mb'}));

    await dataSource.initialize();

    app.get('/', async (req: Request, res: Response) => {
        const serverInfo = {
            protocol: req.protocol,
            host: req.hostname
        };

        const userInfo = {
            ip: req.ip,
            userAgent: req.headers['user-agent']
        };
        res.status(200).json({serverInfo, userInfo});
    });

    app.use('/api/v1/user', userRouter);
    app.use('/api/v1/auth', authRoute);
    // app.use('/api/v1/customer')
    app.use('/api/v1/product', isAuth, commonAuth, showRoomAccess, productRoutes);
    // app.use('/api/v1/purchase')

    app.use('/api/v1/supplier', isAuth, commonAuth, showRoomAccess, supplierRoutes);

    app.use('/api/v1/warehouse', isAuth, commonAuth, showRoomAccess, warehouseRoutes);
    app.use('/api/v1/showroom', isAuth, commonAuth, showRoomAccess, showroomRoutes);

    app.use('/api/v1/barcode', isAuth, commonAuth, showRoomAccess, barcodeRoutes);

    app.use('/api/v1/brands', isAuth, commonAuth, showRoomAccess, brandRoutes);

    app.use('/api/v1/invoice', isAuth, commonAuth, showRoomAccess, invoiceRoutes)

    app.use('/api/v1/customer', isAuth, commonAuth, showRoomAccess, customerRoutes)
    app.use('/api/v1/employee', isAuth, commonAuth, showRoomAccess, employeeRoutes)

    app.use('/api/v1/tax', isAuth, commonAuth, isSuperAdmin, taxRoutes)
    app.use('/api/v1/business', isAuth, commonAuth, isSuperAdmin, businessRoutes)
    app.use('/api/v1/db', seedRoutes)
    app.use('/api/v1/reports', reports)
    app.use('/api/v1/expense', isAuth, commonAuth, showRoomAccess, expense)
    app.use(errorMiddleware);


    io.on('connection', function (socket) {
        console.log('client connected', socket);
    })

    server.listen(config.PORT, () => {
        console.log(`Development Server Started on PORT: ${config.PORT}`);
    });
};

mount(express()).catch(e => console.log(e));
