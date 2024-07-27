import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        title: 'My API',
        description: 'API documentation',
    },
    host: 'localhost:3000', 
    schemes: ['http'],
};

const outputFile = './src/swagger-output.json'; 
const endpointsFiles = ['./src/app.js']; 

swaggerAutogen()(outputFile, endpointsFiles, doc);
