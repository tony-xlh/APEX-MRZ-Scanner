# APEX-MRZ-Scanner
APEX Plug-in to scan MRZ on passports, ID cards, etc., using Dynamsoft Label Recognizer

[Online demo](https://apex.oracle.com/pls/apex/r/dynamsoft/dynamsoft-demos/mrz-scanner?session=116381247959779)

![image](https://github.com/user-attachments/assets/2aabb640-c418-43d7-8978-d73e4d57a3ad)

Run the following code to start scanning:

```js
(async () => {
  if (DLRExtension.reader) {
    await DLRExtension.open(); // open the camera
    DLRExtension.startScanning(); // start a loop to read MRZ from camera frames
  }else{
    alert("The MRZ scanner is still initializing.");
  }
})();
```

Run the following code to stop scanning:

```js
DLRExtension.stopScanning();
DLRExtension.close();
```

Run the following code to get the MRZ results of the last successful scan:

```js
DLRExtension.getResults();
```

## Attributes

* styles. CSS styles for the container.
* license. License for Dynamsoft Label Recognizer. You can apply your license [here](https://www.dynamsoft.com/customer/license/trialLicense?product=dlr).
* MRZ result container. Specify the ID for the container of the parsed MRZ result.


