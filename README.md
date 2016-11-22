# TMS server

## Prerequisites

- Node.JS 7.1.0 +
- [node-canvas related dependencies](https://github.com/Automattic/node-canvas#installation) installed

## Start Server

Be sure you have installed everything that `node-canvas` needs, and use Node.JS
`7.1.0+`.

```
$ node .
```

the server will start listen on `localhost:5000`

## Get Tiles

Simply send GET request to this URL :

`http://localhost:5000/tiles/region_code/z/x/y`

where `region_code` should be `test-region1`.

## Debug Information

Send reuqest to the following URL, will generate tiles which has debug information :

http://localhost:5000/tiles/debug/region_code/z/x/y`
