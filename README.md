# Make Custom Tiles Pack

This is an instruction about making custom map tiles using [node-map-tiles-editor](https://github.com/wkh237/node-map-tiles-editor).

## Prerequisites

- Node.JS > 7.1.
- **node-canvas** platform dependencies installed. [see instruction](https://github.com/Automattic/node-canvas#installation)

## Prepare Image 

`node-map-tiles` simply create tiles by slicing large image into `256x256` tiles, so you will need a single image. In this tutorial, we will use the following image.

![](https://i.imgur.com/FIDasq7.jpg)

It's recommended to use a smaller one for synthesizing the image to map, because the editor is running in browser, it'd be very laggy if the image is huge.

## Start Server

Simply clone or download the project 

```
$ git clone https://github.com/wkh237/node-map-tiles-editor.git
```

Then start the node server

```
$ node .
```

Now you should be able to visit the editor via browser :

[http://localhost:5000/editor](http://localhost:5000/editor)

## Create a Region

Click the `New` button and input the region's name.

![](https://i.imgur.com/6Y2gaED.png)

You will see a JSON file with the name you just input created at `/regions` folder.


## Find a Rough Coordinate

Now, we need a rough cooridate for the region. This can be done by the help of Google Map. 

![](https://i.imgur.com/mIHvv1n.png)

From this image, the latitude is `22.729250` and longitude is `120.404356`, put them into `Latitude` and `Longitude` input box, and click `Go`.

The Map will now centered to the location.

![](https://i.imgur.com/ZGgdkul.png)

## Create Bounding Box

Every region should have a bounding box for slicing tiles. This can be done by simply click on the map and dragging the markers.

![](https://i.imgur.com/qv564h1.png)

After created a bounding box, don't forget to click `Save Changes` button.

## Select Source Image 

To change the source image of a region, simply select it from the `Image dropdown`, it will list images inside `/region-raw-img` folder. Will be able to upload directly from browser, but not ATM.

![](https://i.imgur.com/PJLwRgg.png)

You should be able to see the image draw on the map once you selected it.

## Adjust Bounding Box

Now just moving and resizing the bounding box to most appropriate position and click `Save Change`.

![](https://i.imgur.com/MNgJ8Iw.png)

## See Sample Tiles

Now it's time to see the actaul tiles created from server, scroll down to bottom of the page, you should be able to see a list which tells you how many tiles will be generated with different zoom levels.

![](https://i.imgur.com/j6f6eOe.png)


To render sample tiles simply change the arguments on the panel and click `Render Tiles` button.

## Create Tiles

After everything's confirmed, now go to terminal and create tiles via command :

```
# format : node make-tiles <region name> <zoom-min> <zoom-max>
$ node make-tiles example 15 20
```

![](https://i.imgur.com/fJdFjwA.png)

You can change source image by modifying `image` property in `/regions/<region name>.json`, the script will find the image with the same name inside `/region-raw-image` folder.

The tiles will located in `/regions/<region name>/output/` folder.
