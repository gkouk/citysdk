//
// 	Code designed and written by Laurens Schuurkamp @ Waag Society 1013 --> suggestions laurens@waag.org
//	The code is not perfect at all, so please feel free to compliment for improvements.
//	I learn from you, you learn from me, we learn......
//



WAAG.Repository = function Repository() {

var apiUrl="http://api.citysdk.waag.org/";
var maxEntrys=1000;
var load_queue=[];

var dummyMax=1000;
var dataLayers=[];
var oensBcStdList;
  
  console.log("repository constructor innited");

  initRepository = function() {
    
    //load csv

  	d3.csv("data/oens/csv/stadsdelen.csv", function(d) {
       if(d.bc=="T93"){
         d.std="Bijlmer-Centrum (D, F, H)";
       }else if (d.bc=="T94"){
         d.std="Bijlmer-Oost (E, G, K)";
       }
       return {  
           oens_id: d.bc, 
           oens_name:d.std
         };
         
       }, function(error, data) {
         oensBcStdList=data;
         
         loadMainMap();
         
    });

  };
  
  function loadMainMap(){
    //     for(var i=0; i<1000; i++){
    //       var url="http://api.smartcitizen.me/v0.0.1/9778c68929309f0244c78730e2a64dd5/"+i+"/posts.json"
    //       d3.json(url, function(data){
    //             if(data.length>0){
    //               console.log("results id="+i);
    //               
    //             }

    //        });
    //       
    //     }
    //     http://api.smartcitizen.me/v0.0.1/9778c68929309f0244c78730e2a64dd5/220/posts.json
    // return;  

     var dataLayer={
    			label:"main_geo_map",
    			layers:[
    				{cdk_id:"admr.nl.nederland", subs:[], apiCall:"/regions?admr::admn_level=3&geom", geom:"regions", layer:"main_map", label:"Nederland"}, 
    			]
    		};
    //getApiData(dataLayer.layers[0]); 
    getLocalData(dataLayer.layers[0]);   

	
	  // topomap
  	// d3.json("data/nl_topo_props.json", function(error, results) {
  	//     console.log(results);
  	//     map.setTopoMap(results)
  	//   });
  	
    // getLianderData();
    // var geo = "http://maps.google.com/maps/geo?q=1019";
    //     console.log()
  }
  
  function getLocalData(dataLayer){
  		//addloadDataQueue("data/cdk_cities_nl.json", 1, dataLayer);	
  		addloadDataQueue("data/cdk_cbs_nl.json", 1, dataLayer);	
  }


  function getApiData(dataLayer){
  		addloadDataQueue(apiUrl+dataLayer.cdk_id+dataLayer.apiCall+"&per_page="+maxEntrys+"&page=1", 1, dataLayer);	
  }

  function getRegions(url, page, dataLayer){
	
  	d3.json(url, function(data){
  				console.log("results ="+data.results.length);
  				for(var i=0; i<data.results.length; i++){
  					var name=data.results[i].name.toLowerCase();
  					var id=data.results[i].cdk_id.toLowerCase();
					
					
  					if(dataLayer.layer=="cbs_nl"){
  						var url=apiUrl+id+"?layer=cbs&geom&per_page="+maxEntrys+"&page=1";
  					}else if(dataLayer.layer="cbs_gemeentes"){
  						var url=apiUrl+id+"/regions?admr::admn_level=4&layer=cbs&geom&per_page="+maxEntrys+"&page=1";
  					}

  					var loadObject={
  						url:url,
  						page:1,
  						dataLayer:dataLayer
						
  					}
  					load_queue.push(loadObject);

  					$("#feedback").text("api call : "+url);
  					loadDataQueue();	
  				}

  		});

  }


  function loadDataQueue(){
  	while(load_queue.length)
  	{
  		var loadObject = load_queue[0]; 
  		load_queue.shift();
  		getData(loadObject.url, 1, loadObject.dataLayer);
		
  	}

  }

  function addloadDataQueue(url, page, dataLayer){
  	var loadObject={
  		url:url,
  		page:1,
  		dataLayer:dataLayer,

  	}
	
  	if(load_queue.length>0){
  		load_queue.unshift(loadObject);
  	}else{
  		load_queue.push(loadObject);
  		loadDataQueue();
  	}
	
	
  }

  function getData(url, page, dataLayer){
    console.log("api cal "+url);

    d3.json(url, function(json){
          
      
      if(page==1){
        dataLayer.data=json.results;
      }else{
        var dataConcat=dataLayer.data.concat(json.results);
        dataLayer.data=dataConcat;
        
      }
            
      if(json.results.length>=(maxEntrys/2)){
        var oldUrl = url;
  			var n = url.search("&page=");
  			var slicedUrl = oldUrl.slice(0, n);
  			var nextPage = page + 1;
  			var newUrl = slicedUrl + "&page=" + nextPage;                
        getData(newUrl, nextPage, dataLayer);
      }else{
        console.log("adding "+dataLayer.layer+" _ label ="+dataLayer.label+" --> entrys ="+json.results.length)
        if(dataLayer.label=="Amsterdam"){
          getOensDataSets(dataLayer);
          //geoMap.preProcesData(dataLayer);
        }else{
          geoMap.preProcesData(dataLayer);
        }

      }

  	});

  };
  
  
  
  function getOensDataSets(dataLayer){
    
    if(oensBcStdList.length>0){
        dataLayer.data.forEach(function(d){
          d.layers.oens={id:"none", std:"none", layers:{}};
          
           
          for(var i=0; i<oensBcStdList.length; i++){
            if(oensBcStdList[i].oens_name.toLowerCase()==d.name.toLowerCase()){
              d.layers.oens.id=oensBcStdList[i].oens_id;
            };
          } ; 

        // var i=0;
        //         while(i<oensBcStdList.length)
        //        {
        //          if(oensBcStdList[i].oens_name.toLowerCase()==d.name.toLowerCase()){
        //             d.oens={id:oensBcStdList[i].oens_id, data:{} };
        //             oensBcStdList.splice(i, 1);
        //           }else{
        //             i++;
        //           }
        // 
        //        }

      });
    }
    //reset oenslist
    oensBcStdList=[]
    
    d3.csv("data/oens/csv/2013_stadsdelen_01_bevolking_2009-2013.csv", function(d) {
        return d;       
       }, function(error,data) {

         for(var i=0; i<data.length; i++){
            var bcstd= data[i]["bc/std"];
            var index = bcstd.search(" ");
            var bc=bcstd.slice(0,index);
            for(var j=0; j<dataLayer.data.length; j++){
              if(dataLayer.data[j].layers.oens.id==bc){
                dataLayer.data[j].layers.oens.layers["bevolking_2009-2013"]=data[i];
              }
            };
         }
         geoMap.preProcesData(dataLayer);       
    });

  };
    
  function getLianderData(){
  //   d3.tsv("data/LianderKV01012013.csv", function(d) {
  //       
  //       //console.log(d["WOONPLAATS"]);
  //       return d ;       
  //      }, function(error, data) {
  //        console.log("liander length :"+data.length);
  //        //geoMap.preProcesData(dataLayer);
  //        
  //   });
  //   
  //   
  // };
  // 
  // var lianderData={
  //   name:"Liander",
  //   children:[]
  //   }; 
  }
  
  getCbsData = function(cdk_id, label, level){
        
    for(var i=0; i<dataLayers.length; i++){
      if(dataLayers[i].cdk_id==cdk_id){
        geoMap.updateDataSet(dataLayers[i]);
        return;
      }  
    }    
    var url=apiUrl+cdk_id+"/regions?admr::admn_level="+level+"&layer=cbs&geom&per_page="+maxEntrys+"&page=1";
    var layer={cdk_id:cdk_id, apiCall:"/regions?admr::admn_level="+level+"&layer=cbs&geom", geom:"regions", layer:"cbs", label:label}
    dataLayers.push(layer);
    getApiData(layer);

  };
  
  setCbsNlMap = function(dataLayer){
    dataLayers.push(dataLayer);
    geoMap.updateDataSet(dataLayer);
  }

  this.setCbsNlMap=setCbsNlMap;
  this.initRepository=initRepository;
  this.getCbsData=getCbsData;

  return this;

}
