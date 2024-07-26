import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        title: 'My API',
        description: 'API documentation',
    },
    host: 'localhost:3000', // Change this to your server's host and port
    schemes: ['http'],
};

const outputFile = './src/swagger-output.json'; // Place the output file in the src directory
const endpointsFiles = ['./src/app.js']; // Point to the src directory

swaggerAutogen()(outputFile, endpointsFiles, doc);
