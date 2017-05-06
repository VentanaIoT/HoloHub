# HoloHub 
Powering the awesomeness of Ventana IoT.

## Requirements

- Node and npm

## Attention for Reviewers

In order to best review our project, it is important to understand the structure of the repositories. We have three main repos: 
1. [Vive-Diy-Position-Sensor](https://github.com/VentanaIoT/vive-diy-position-sensor/) This repository houses the Hardware and Software code and details for the positional tracking sensor.
2. [HoloHub](https://github.com/VentanaIoT/HoloHub/tree/bluetooth_serial) This repository contains the server code that facilitates and communications to the HoloLens and the Positional Tracking Sensor.
3. [Ventana](https://github.com/VentanaIoT/Ventana/tree/feature-PositionalTracking) This repository contains the HoloLens code built on Unity & C# to run the Ventana app with the positional tracking features enabled.

This should help reviewers better naviagate our code structure and understand the rolling progress of our project. Thank you!

## Installation

- Install dependencies: `npm install`
- Start the server: `node server.js`

## Testing the API
Test your API using [Postman](https://chrome.google.com/webstore/detail/postman-rest-client-packa/fhbjgbiflinjbdggehcddcbncdddomop)
