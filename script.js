const cep = document.getElementById('cep');
const productList = document.getElementById('product-list');
const selectedShop = document.getElementById('selected-shop');
const userLocation = document.getElementById('location');
let nearestShop = {
    id: "",
    tipo: "",
    latitude: "",
    longitude: "",
    cep: "",
    bairro: "",
};
let searchPosition = {
    latitude: "",
    longitude: "",
    bairro: "",
};
let shops = [];

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

// search using customer location
function detectCustomerLocation() {

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
                    
                searchPosition = {
                    latitude: data.latitude,
                    longitude: data.longitude,
                    bairro: data.locality
                }
                console.log(searchPosition);
                userLocation.innerHTML = 
                `<div>${searchPosition.bairro}<br />
                <small>${searchPosition.latitude}, ${searchPosition.longitude}</small></div>`;

                findNearestShop(searchPosition.latitude, searchPosition.longitude);

            })
            .catch(e => console.log("Erro: " + e.message))
    };

    const error = () => {
        userLocation.textContext = "Não foi possível detectar sua localização.";
    };

    navigator.geolocation.getCurrentPosition(success, error, options);
}


// search by CEP 
function checkCep() {

    const search = cep.value.replace('-', '');
    const options = {
        method: 'GET',
        mode:'cors',
        cache:'default'
    };

    if (cep.value != "") {        
        // verify if there is a shop in that specific CEP
        for (let i in shops) {
            if (search == shops[i].cep) {
                nearestShop = {
                    bairro: shops[i].bairro,
                    cep: shops[i].cep,
                    latitude: shops[i].latitude,
                    longitude: shops[i].longitude,
                    tipo: shops[i].tipo,
                    id: shops[i].id
                }

                searchPosition = {
                    latitude: shops[i].latitude,
                    longitude: shops[i].longitude,
                    bairro: shops[i].bairro
                }

                findNearestShop(searchPosition.latitude, searchPosition.longitude);

                return userLocation.innerHTML = 
                `<div>${searchPosition.bairro}<br />
                <small>${searchPosition.latitude}, ${searchPosition.longitude}</small></div>`;
            }
        }

        // get the coordinates of that CEP
        fetch(`https://nominatim.openstreetmap.org/search?postalcode=${cep.value}&format=json`, options)            
                .then(response => response.json())
                .then(data => {

                    searchPosition = {
                        latitude: data[0].lat,
                        longitude: data[0].lon,
                        bairro: data[0].display_name.substring(0, data[0].display_name.indexOf(','))
                    }

                    userLocation.innerHTML = 
                    `<div>${searchPosition.bairro}<br />
                    <small>${searchPosition.latitude}, ${searchPosition.longitude}</small></div>`;

                    findNearestShop(searchPosition.latitude, searchPosition.longitude);
                })
                .catch(e => console.log("Erro: " + e.message))
        ;

    } else {
        selectedShop.innerHTML =
            `Por favor informe um CEP para pesquisa.`
    }

}

// search using Carrefour API
function findShopByCep() {

    const search = cep.value.replace('-', '');
    const options = {
        method: 'GET',
        mode:'cors',
        cache:'default'
    };
   
    if (cep.value != "") {  

        fetch(`https://mercado.carrefour.com.br/api/checkout/pub/regions?country=BRA&postalCode=${search}`, options)
            .then(response => response.json())
            .then(data => {

                for (let i in shops) {
                    if (data[0].sellers[i].id == shops[i].id) {
                        nearestShop = {
                            bairro: shops[i].bairro,
                            cep: shops[i].cep,
                            latitude: shops[i].latitude,
                            longitude: shops[i].longitude,
                            tipo: shops[i].tipo,
                            id: shops[i].id
                        }

                        return selectedShop.innerHTML =
                            `Carrefour ${nearestShop.tipo} - ${nearestShop.bairro}`;
                    }
                }
            })
            .catch(e => console.log("Erro: " + e.message))
        ;

    } else {
        selectedShop.innerHTML =
            `Por favor informe um CEP para pesquisa.`

    }
    
};

// calculate distance based on latitude and longitude
function findNearestShop(latitude1, longitude1) {

    for (let i in shops) {
        let firstRadlat = Math.PI * latitude1 / 180;
        let secondRadlat = Math.PI * shops[i].latitude / 180;
        let theta = longitude1 - shops[i].longitude;
        let radtheta = Math.PI * theta / 180;
        
        let distance = Math.sin(firstRadlat) * Math.sin(secondRadlat) + Math.cos(firstRadlat) * Math.cos(secondRadlat) * Math.cos(radtheta);
        
        distance = Math.acos(distance);
        distance = distance * 180 / Math.PI;
        distance = distance * 60 * 1.1515;
        
        distance = distance * 1.609344;
        
        shops[i].distance = distance;

        if (i > 0) {
            if (shops[i].distance < shops[i-1].distance) {
                nearestShop = {
                    bairro: shops[i].bairro,
                    cep: shops[i].cep,
                    latitude: shops[i].latitude,
                    longitude: shops[i].longitude,
                    tipo: shops[i].tipo,
                    id: shops[i].id
                }
            }
        } else {
            nearestShop = {
                bairro: shops[i].bairro,
                cep: shops[i].cep,
                latitude: shops[i].latitude,
                longitude: shops[i].longitude,
                tipo: shops[i].tipo,
                id: shops[i].id
            }
        }
        console.log(shops[i].bairro + ", " + shops[i].distance);
        console.log("mais próximo:" + nearestShop.bairro);
        
    }

    selectedShop.innerHTML =
    `A loja mais próxima é a: ${nearestShop.bairro}`;

    showProductsList();

}


// list offers of the nearest shop
function showProductsList() {
    clearProductsPage();
    const options = {
        method: 'GET',
        mode: 'cors',
        cache:'default'
    }
    
    fetch(`https://mercado.carrefour.com.br/api/catalog_system/pub/products/search?fq=${nearestShop.id}`, options)
        .then(response => response.json())
        .then(data => {

            productList.innerHTML = `
            <h3>Aproveite as ofertas desta loja</h3>`;
            
            for (let i in data) {
                const li = document.createElement("li");
                productList.appendChild(li).innerHTML = `
                <div class="product-box">
                    Cód: ${data[i].productId}<br />
                    ${data[i].productName}<br />
                    Marca: ${data[i].brand}<br />
                    Preço: ${data[i].items[0].sellers[0].commertialOffer.ListPrice.toString().replace(".",",")}<br />
                    <img src="${data[i].items[0].images[0].imageUrl}" width="100px" "height=100px" alt="${data[i].metaTagDescription}">
                    <button href="${data[i].link}">ver no site</button>
                </div>
                `;
            }
        })
        .catch(e => console.log("Erro: " + e.message))
    ;
};


function clearProductsPage() {
    productList.innerHTML = ``;
}

window.onload = populateShopsList();