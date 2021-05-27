window.$ = (tag, all) => {
  if (!tag){
    console.warn('Please check if the passed css selector is correct')
    return null
  }
  if (!document.querySelector) {
    console.warn('Browser does not support querySelector')
    return null
  }
  if (all){
    return document.querySelectorAll(tag)
  }else{
    return document.querySelector(tag)
  }
}
$.ajax = function(json){
    if (!json) return;
    let type = json.type.toUpperCase();
    let url = json.url;
    let data = json.data;
    let success = json.success;
    let error = json.error;


    // IE6, IE5 Browser compatible code execution
    let xmlHttp = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
  
    if (type === "GET") {
      if (data) {
        let res = Object.keys(data).map((key) => `${key}=${data[key]}`).join('&');
        url += ('?' + res);
      }
      xmlHttp.open(type, url, true);
      xmlHttp.send();
    }
  
    if (type === 'POST') {
        xmlHttp.open(type, url, true);
        xmlHttp.setRequestHeader('Content-type', "application/x-www-form-urlencoded");
        xmlHttp.send(data);
    }

   
    xmlHttp.onload = function(){
        
        if (xmlHttp.status === 200 || xmlHttp.status === 304 || xmlHttp.status === 206) {
            
            const res = JSON.parse(xmlHttp.responseText)
            if (xmlHttp.responseText && res && res.code === 0) {
                success && success(res.data);
            } else {
                alert('Network request failure，Please try again！')
            }
        } else {
            error && error(xmlHttp.responseText)
        }
    }

}
// window.tool = {
//   ajax(type, url, data, fun){
//     const ajax = new XMLHttpRequest()
//     ajax.open(type, url, true)
//     ajax.send(data)
//     ajax.onreadystatechange = function () {
//       if (ajax.readyState == 4 && ajax.status == 200) {
//         const res = JSON.parse(ajax.responseText)
//         if (ajax.responseText && res && res.code === 0) {
//           fun(res.data)
//         } else {
//           alert('Network request failure，Please try again！')
//         }
//       }
//     }
//   }
// }
