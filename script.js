const detectBtn = document.getElementById('gps-button');
const searchByGpsBox = document.getElementById('search-by-gps');
const searchBtn = document.getElementById('cep-button');
const searchByCepBox = document.getElementById('search-by-cep');
const cep = document.getElementById('cep');
const cepOrigin = document.getElementById('cep-origin');
const selectedShop = document.getElementById('selected-shop');
const productList = document.getElementById('product-list');
let shops = [];
let nearestShop = {
    id: "",
    tipo: "",
    latitude: "",
    longitude: "",
    cep: "",
    bairro: "",
};
let originPosition = {
    bairro: "",
    latitude: "",
    longitude: ""
};

searchBtn.addEventListener('click', detectLocationByCep);
detectBtn.addEventListener('click', detectUserLocation);


// detect customer location
function detectUserLocation() {

    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    const success = (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt-br`, options)
            .then(response => response.json())
            .then(data => {
                    
                originPosition = {
                    latitude: data.latitude,
                    longitude: data.longitude,
                    bairro: data.locality
                }
                console.log(originPosition);
                cepOrigin.innerHTML = 
                    `<div>Localização atual: ${originPosition.bairro}<br /><small>(${parseFloat(originPosition.latitude).toFixed(3)}, ${parseFloat(originPosition.longitude).toFixed(3)})</small></div>`;

                listDistanceToShops();

                selectedShop.innerHTML = 
                    `<div>Loja mais próxima: ${nearestShop.bairro} ${nearestShop.tipo}<br /><small>(${parseFloat(nearestShop.latitude).toFixed(3)}, ${parseFloat(nearestShop.longitude).toFixed(3)})</small></div>`;

                showProductsList(nearestShop.id);  

            })
            .catch(e => console.log("Erro: " + e.message))
    };

    const error = () => {
        cepOrigin.textContext = "Não foi possível detectar sua localização.";
    };

    navigator.geolocation.getCurrentPosition(success, error, options);
}

// detect location using 'CEP Aberto API' (https://www.cepaberto.com/)
function detectLocationByCep() {

    resetResults();
    
    if (cep.value != "") {
        // check if CEP is already listed
        for (let i in shops) {
            if (cep.value == shops[i].cep) {
                nearestShop = shops[i];
                originPosition = shops[i];

                cepOrigin.innerHTML = 
                    `<div>Localização atual: ${originPosition.bairro}<br /><small>(${parseFloat(originPosition.latitude).toFixed(3)}, ${parseFloat(originPosition.longitude).toFixed(3)})</small></div>`;

                selectedShop.innerHTML = 
                    `<div>Loja mais próxima: ${nearestShop.bairro} ${nearestShop.tipo}<br /><small>(${parseFloat(nearestShop.latitude).toFixed(3)}, ${parseFloat(nearestShop.longitude).toFixed(3)})</small></div>`;

                showProductsList(nearestShop.id);
            }
        }

        if (!nearestShop.id) {
            // if CEP is not listed, search using 'CEP Aberto API'
            const search = cep.value.replace('-', '');
            const options = {
                method: 'GET',
                mode:'cors',
                cache:'default',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': '*',
                    'Credentials': 'true',
                    'Authorization': 'Token token=5b89b0d77d70e9063fcf6f0cb626dbdf'  // temporary API
                }
            };
            
            const proxy = "https://afternoon-basin-78871.herokuapp.com/";
            fetch(`${proxy}https://www.cepaberto.com/api/v3/cep?cep=${search}`, options)            
            .then(response => response.json())
            .then(data => {

                if (typeof data === "undefined") {
                    cepOrigin.innerHTML = "Não foi possível detectar sua localização.";
                }

                originPosition = {
                    latitude: data.latitude,
                    longitude: data.longitude,
                    bairro: data.bairro
                }

                cepOrigin.innerHTML = 
                    `<div>Localização atual: ${originPosition.bairro}<br /><small>(${parseFloat(originPosition.latitude).toFixed(3)}, ${parseFloat(originPosition.longitude).toFixed(3)})</small></div>`;

                listDistanceToShops();

                selectedShop.innerHTML = 
                    `<div>Loja mais próxima: ${nearestShop.bairro} ${nearestShop.tipo}<br /><small>(${parseFloat(nearestShop.latitude).toFixed(3)}, ${parseFloat(nearestShop.longitude).toFixed(3)})</small></div>`;

                showProductsList(nearestShop.id);  

            })
            .catch(e => console.log("Erro: " + e.message))
        }
    } else {
        cepOrigin.innerHTML =
            `Por favor informe um CEP para pesquisa.`
    }
}

function listDistanceToShops() {
    
    for (let i in shops) {
        shops[i].distance = calculateDistance(originPosition.latitude, originPosition.longitude, shops[i].latitude, shops[i].longitude);
        console.log(shops[i].bairro + ": " + shops[i].distance);
    }

    nearestShop = shops.reduce(function(previous, current) {
            return previous.distance < current.distance ? previous : current;
        });
        console.log(nearestShop);

}

// list offers of the nearest shop using 'Carrefour API'
function showProductsList(location) {
    clearProductsPage();
    const options = {
        method: 'GET',
        mode: 'cors',
        cache:'default'
    }
    
    fetch(`https://mercado.carrefour.com.br/api/catalog_system/pub/products/search?fq=${location}`, options)
        .then(response => response.json())
        .then(data => {

            for (let i in data) {
                const price = data[i].items[0].sellers[0].commertialOffer.ListPrice;
                const li = document.createElement("li");
                let discount = generateRandomDiscount(10, 15);

                productList.appendChild(li).innerHTML = `
                    <div class="product-box">
                        <div class="product-header">
                            <h3>${data[i].productName}</h3>
                            <div class="brand">Marca: ${data[i].brand}</div>
                            <div class="small">Cód: ${data[i].productId}</div>
                            <div class="discount-box">-${discount}%</div>
                            <div class="old-price">R$ ${price.toFixed(2).toString().replace(".",",")}</div>
                            <div class="price">R$ ${parseFloat((price - ((price * discount)/100))).toFixed(2).toString().replace(".",",")}</div>
                        </div>
                        <div class="product-section">
                            <img src="${data[i].items[0].images[0].imageUrl}" alt="${data[i].metaTagDescription}">
                        </div>
                        <div class="product-footer">
                            <a href="${data[i].link}" target="_blank"><span class="btn">ver no site</span></a>
                        </div>
                    </div>
                    `;
            }
        })
        .catch(e => console.log("Erro: " + e.message))
    ;
};


// =======  SUPPORT FUNCTIONS  ========

// Clean coordinates for a new search
function resetResults() {
    originPosition = "";
    nearestShop = "";
    cepOrigin.innerHTML = "";
    selectedShop.innerHTML = "";
}

// Clean listed products page
function clearProductsPage() {
    productList.innerHTML = ``;
}

// Temporary function to generate random discount
function generateRandomDiscount(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

// Calculate distance between 2 geolocation points
function calculateDistance(latitude1, longitude1, latitude2, longitude2) {

    let R = 6371; // km
    let dLat = toRad(latitude2 - latitude1);
    let dLon = toRad(longitude2 - longitude1);
    let lat1 = toRad(latitude1);
    let lat2 = toRad(latitude2);

    let a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    let distance = R * c;
    
    return distance;
}

// Converts numeric degrees to radians
function toRad(Value) 
{
    return Value * Math.PI / 180;
}

// Fill array with list of available shops using internal .JSON file
function populateShopsList() {

    const shopListLocation = "./listedshops.json";
    const options = {
        method: 'GET',
        mode: 'cors',
        cache: 'default'
    }

    fetch(shopListLocation, options)
        .then(response => response.json())
        .then(data => {
            for (let i in data) {
            shops.push(data[i]);
            }
        })
        .catch(e => console.log("Erro: " + e.message));
    ;
}


window.onload = populateShopsList();