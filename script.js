let DLRExtension = {
  router:undefined,
  enhancer:undefined,
  regionID:undefined,
  item:undefined,
  interval:undefined,
  processing:undefined,
  textResults:undefined,
  callback:undefined,
  parser:undefined,
  setCallback: function(callback){
    this.callback = callback;
  },
  open: async function(){
    document.getElementById("enhancerUIContainer").style.display = "";
    await this.enhancer.open(true);
  },
  close: function(){
    this.enhancer.close(true);
    document.getElementById("enhancerUIContainer").style.display = "none";
  },
  startScanning: function(){
    this.stopScanning();
    let pThis = this;
    const captureAndDecode = async function() {
      if (!pThis.enhancer || !pThis.router) {
        return;
      }
      if (!pThis.enhancer.isOpen()) {
        return;
      }
      if (pThis.processing === true) {
        return;
      }
      pThis.processing = true; // set decoding to true so that the next frame will be skipped if the decoding has not completed.
      let frame = pThis.enhancer.fetchImage();
      if (frame) {
        let result = await pThis.router.capture(frame,"mrz");
        console.log(result)
        if (result.items && result.items.length > 0) {
          pThis.textResults = result.items;
          if (pThis.callback) {
            pThis.callback(result.items);
          }
          if ('apex' in window) {
            if (pThis.item) {
              apex.item(pThis.item).setValue(pThis.getMRZString(result.items));
            }
            //if (pThis.ajax) {
            //  apex.server.process("SINGLE_BARCODE_SCANNED", {x01:results[0].barcodeText}, {dataType: "text", success: function(){}});
            //}
          }
        }
        pThis.processing = false;
      }
    }
    this.interval = setInterval(captureAndDecode,100); // set an interval to read barcodes
  },
  getMRZString: function(items){
    let str = "";
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      str = str + item.text;
      if (index != items.length - 1) {
        str = str + "\n";
      }
    }
    return str;
  },
  getParsedResult: async function(mrzString){
    let parsedResultItem = await this.parser.parse(mrzString);
    return parsedResultItem;
  },
  getParsedString: async function(mrzString){
    let str = "";
    let parsedResultItem = await this.parser.parse(mrzString);
    console.log(parsedResultItem);
    let MRZFields = ["documentNumber","passportNumber","issuingState","name","sex","nationality","dateOfExpiry","dateOfBirth"];
    for (let index = 0; index < MRZFields.length; index++) {
      const field = MRZFields[index];
      const value = parsedResultItem.getFieldValue(field);
      console.log(field);
      console.log(value);
      if (value){
        str = str + field + ": " + value + "\n";
      }
    }
    return str;
  },
  stopScanning: function(){
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    this.processing = false;
  },
  init: async function(pConfig){
    await Dynamsoft.DCP.CodeParserModule.loadSpec("MRTD_TD1_ID");
    await Dynamsoft.DCP.CodeParserModule.loadSpec("MRTD_TD2_FRENCH_ID");
    await Dynamsoft.DCP.CodeParserModule.loadSpec("MRTD_TD2_ID");
    await Dynamsoft.DCP.CodeParserModule.loadSpec("MRTD_TD2_VISA");
    await Dynamsoft.DCP.CodeParserModule.loadSpec("MRTD_TD3_PASSPORT");
    await Dynamsoft.DCP.CodeParserModule.loadSpec("MRTD_TD3_VISA");
    this.parser = await Dynamsoft.DCP.CodeParser.createInstance();
    Dynamsoft.Core.CoreModule.loadWasm(["DLR"]);
    this.router = await Dynamsoft.CVR.CaptureVisionRouter.createInstance();
    await this.router.initSettings("{\"CaptureVisionTemplates\": [{\"Name\": \"mrz\",\"ImageROIProcessingNameArray\": [\"roi-mrz-passport\"]}],\"TargetROIDefOptions\": [{\"Name\": \"roi-mrz-passport\",\"TaskSettingNameArray\": [\"task-mrz-passport\"]}],\"TextLineSpecificationOptions\": [{\"Name\": \"tls-mrz-text\",\"CharacterModelName\": \"MRZ\",\"StringRegExPattern\": \"([ACI][A-Z<][A-Z<]{3}[A-Z0-9<]{9}[0-9][A-Z0-9<]{15}){(30)}|([0-9]{2}[(01-12)][(01-31)][0-9][MF<][0-9]{2}[(01-12)][(01-31)][0-9][A-Z<]{3}[A-Z0-9<]{11}[0-9]){(30)}|([A-Z<]{30}){(30)}|([ACIV][A-Z<][A-Z<]{3}[A-Z<]{31}){(36)}|([A-Z0-9<]{9}[0-9][A-Z<]{3}[0-9]{2}[(01-12)][(01-31)][0-9][MF<][0-9]{2}[(01-12)][(01-31)][0-9][A-Z0-9<]{8}){(36)}|([PV][A-Z<][A-Z<]{3}[A-Z<]{39}){(44)}|([A-Z0-9<]{9}[0-9][A-Z<]{3}[0-9]{2}[(01-12)][(01-31)][0-9][MF<][0-9]{2}[(01-12)][(01-31)][0-9][A-Z0-9<]{14}[A-Z0-9<]{2}){(44)}\",\"StringLengthRange\": [30,44],\"CharHeightRange\": [5,1000,1],\"BinarizationModes\": [{\"BlockSizeX\": 30,\"BlockSizeY\": 30,\"Mode\": \"BM_LOCAL_BLOCK\",\"MorphOperation\": \"Close\"}]},{\"Name\": \"tls-mrz-passport\",\"StringRegExPattern\": \"(P[A-Z<][A-Z<]{3}[A-Z<]{39}){(44)}|([A-Z0-9<]{9}[0-9][A-Z<]{3}[0-9]{2}[(01-12)][(01-31)][0-9][MF<][0-9]{2}[(01-12)][(01-31)][0-9][A-Z0-9<]{14}[0-9<][0-9]){(44)}\",\"StringLengthRange\": [44,44],\"BaseTextLineSpecificationName\": \"tls-mrz-text\"}],\"LabelRecognizerTaskSettingOptions\": [{\"Name\": \"mrz-text-task\",\"TextLineSpecificationNameArray\": [\"tls-mrz-text\"],\"SectionImageParameterArray\": [{\"Section\": \"ST_REGION_PREDETECTION\",\"ImageParameterName\": \"ip-mrz-text\"},{\"Section\": \"ST_TEXT_LINE_LOCALIZATION\",\"ImageParameterName\": \"ip-mrz-text\"},{\"Section\": \"ST_TEXT_LINE_RECOGNITION\",\"ImageParameterName\": \"ip-mrz-text\"}]},{\"Name\": \"task-mrz-passport\",\"TextLineSpecificationNameArray\": [\"tls-mrz-text\"],\"BaseLabelRecognizerTaskSettingName\": \"mrz-text-task\"}],\"CharacterModelOptions\": [{\"Name\": \"MRZ\"}],\"ImageParameterOptions\": [{\"Name\": \"ip-mrz-text\",\"TextureDetectionModes\": [{\"Mode\": \"TDM_GENERAL_WIDTH_CONCENTRATION\",\"Sensitivity\": 8}],\"TextDetectionMode\": {\"Mode\": \"TTDM_LINE\",\"CharHeightRange\": [20,1000,1],\"Sensitivity\": 7}}]}");
    let container = document.createElement("div");
    container.id = "enhancerUIContainer";
    if ('apex' in window) {
      this.regionID = pConfig.regionID;
      this.item = pConfig.item;
      const region = document.getElementById(this.regionID);
      region.appendChild(container);
    }else{
      document.body.appendChild(container);
    }
    let cameraView = await Dynamsoft.DCE.CameraView.createInstance();
    this.enhancer = await Dynamsoft.DCE.CameraEnhancer.createInstance(cameraView);
    container.append(cameraView.getUIElement());
    if (pConfig.styles) {
      let styles = JSON.parse(pConfig.styles); //{width:"100%"} e.g.
      for (const key in styles) {
        container.style[key] = styles[key];
      }
    }
    this.enhancer.on("played", (playCallbackInfo) => {
      if (this.interval) {
        this.startScanning();
      }
    });
    container.style.display = "none";
    if ('apex' in window) {
      apex.region.create(
        pConfig.regionID,
        {                
          type: 'Dynamsoft Label Recognizer',
          open: async function(){
            await DLRExtension.open();
          },
          close: function(){
            DLRExtension.close();
          },
          startScanning: function() {
            DLRExtension.startScanning();
          },
          stopScanning: function() {
            DLRExtension.stopScanning();
          },
          getResults: function(){
            return DLRExtension.getResults();
          }
        }
      );
    }
  },
  getResults: function() {
    return this.textResults;
  },
  load: async function(pConfig){
    try {
      window.Dynamsoft.CVR.CaptureVisionRouter;
    }catch{
      await this.loadLibrary("https://cdn.jsdelivr.net/npm/dynamsoft-core@3.0.33/dist/core.js","text/javascript");
      await this.loadLibrary("https://cdn.jsdelivr.net/npm/dynamsoft-license@3.0.40/dist/license.js","text/javascript");
      await this.loadLibrary("https://cdn.jsdelivr.net/npm/dynamsoft-label-recognizer@3.0.30/dist/dlr.js","text/javascript");
      await this.loadLibrary("https://cdn.jsdelivr.net/npm/dynamsoft-code-parser@2.0.20/dist/dcp.js","text/javascript");
      await this.loadLibrary("https://cdn.jsdelivr.net/npm/dynamsoft-capture-vision-router@2.0.32/dist/cvr.js","text/javascript");
    }
    try {
      window.Dynamsoft.DCE.CameraEnhancer;
    }catch{
      await this.loadLibrary("https://cdn.jsdelivr.net/npm/dynamsoft-camera-enhancer@4.0.2/dist/dce.js","text/javascript");
    }
    if (pConfig.license) {
      Dynamsoft.License.LicenseManager.initLicense(pConfig.license);
    }else{
      Dynamsoft.License.LicenseManager.initLicense("DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ==");
    }
  },
  loadLibrary: function (src,type,id,data){
    return new Promise(function (resolve, reject) {
      let scriptEle = document.createElement("script");
      scriptEle.setAttribute("type", type);
      scriptEle.setAttribute("src", src);
      if (id) {
        scriptEle.id = id;
      }
      if (data) {
        for (let key in data) {
          scriptEle.setAttribute(key, data[key]);
        }
      }
      document.body.appendChild(scriptEle);
      scriptEle.addEventListener("load", () => {
        console.log(src+" loaded")
        resolve(true);
      });
      scriptEle.addEventListener("error", (ev) => {
        console.log("Error on loading "+src, ev);
        reject(ev);
      });
    });
  },
  loadStyle: function (url) {
    return new Promise(function (resolve, reject) {
      let linkEle = document.createElement('link')
      linkEle.type = 'text/css'
      linkEle.rel = 'stylesheet'
      linkEle.href = url
      let head = document.getElementsByTagName('head')[0]
      head.appendChild(linkEle)
      linkEle.addEventListener("load", () => {
        console.log(url+" loaded")
        resolve(true);
      });
      linkEle.addEventListener("error", (ev) => {
        console.log("Error on loading "+url, ev);
        reject(ev);
      });
    });
  }
}
