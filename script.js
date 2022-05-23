const cep = document.getElementById('cep');
const list = document.getElementById('list');
const selectedShop = document.getElementById('selected-shop');
let nearestShop = "";
let userCurrentLatitude = "";
let userCurrentLongitude = "";
let shops = [];

window.onload = getShopsList();

function getShopsList() {

    const shoplistLocation = "./listedshops.json";
    const options = {
        method: 'GET',
        mode: 'no-cors',
        cache:'default'
    }

    fetch(shoplistLocation, options)
        .then(response => response.json())
        .then(data => {
            for (let i in data) {
            shops.push(data[i]);
            }
        })
        .catch(e => console.log("Erro: " + e.message));
    ;
}



function detectCustomerCurrentLocation() {

    const location = document.getElementById('location');
    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    const success = (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const geoApiUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt-br`;
        fetch(geoApiUrl)
            .then(response => response.json())
            .then(data => {
                location.innerHTML = 
                    `${data.principalSubdivision}`;
                    cep.value = data.postcode;
                    console.log(data.latitude);
                    console.log(data.longitude);
                    console.log(data);
                    

                    // Update customer current location to calculate distance from customer to nearest shops
                    userCurrentLatitude = data.latitude;
                    userCurrentLongitude = data.longitude;
            })
            .catch(e => console.log("Erro: " + e.message))

    };

    const error = () => {
        location.textContext = "Não foi possível detectar sua localização.";
    };

    navigator.geolocation.getCurrentPosition(success, error, options);
}



function findShopByCep() {

    const options = {
        method: 'GET',
        mode:'no-cors',
        cache:'default'
    };

    if (cep.value) {
        for (let i in shops) {
        if (cep.value == shops[i].cep) {
                selectedShop.innerHTML =
                `Carrefour ${shops[i].tipo} - ${shops[i].bairro}`;
            }
        }
    } else {
    
    let search = cep.value.replace('-', '');
    fetch(`https://mercado.carrefour.com.br/api/checkout/pub/regions?country=BRA&postalCode=${search}`, options)
        .then(response => response.json())
        .then(data => {
            for (let i in data[0].sellers) {
                if (data[0].sellers[i].id == shops[i].id) {
                selectedShop.innerHTML =
                    `Carrefour ${shops[i].tipo} - ${shops[i].bairro}`;
                }
            } 
        })
        .catch(e => console.log("Erro: " + e.message))
    ;
    }
};


function listOffers() {
    clearProductsPage();
    const options = {
        method: 'GET',
        mode: 'no-cors',
        cache:'default'
    }
    
    let selectedNearestShop = "";
    for (let i in shops) {
        if (nearestShop == shops[i].bairro) {
            selectedNearestShop = shops[i].id;
        }
    }
 
    fetch(`https://mercado.carrefour.com.br/api/catalog_system/pub/products/search?fq=${selectedNearestShop}`, options)
        .then(response => response.json())
        .then(data => {

            console.log(data);
            list.innerHTML = `
            <h3>Aproveite as ofertas desta loja</h3>`;
            
            for (let i in data) {
                const li = document.createElement("li");
                list.appendChild(li).innerHTML = `
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
    list.innerHTML = ``;
}



function findNearestShop() {
    getShopsList();
    detectCustomerCurrentLocation();

    for (let i in shops) {
        let firstRadlat = Math.PI * userCurrentLatitude/180;
        let secondRadlat = Math.PI * shops[i].latitude/180;
        let theta = userCurrentLongitude-shops[i].longitude;
        let radtheta = Math.PI * theta/180;
        let distance = Math.sin(firstRadlat) * Math.sin(secondRadlat) + Math.cos(firstRadlat) * Math.cos(secondRadlat) * Math.cos(radtheta);
        
        distance = Math.acos(distance);
        distance = distance * 180 / Math.PI;
        distance = distance * 60 * 1.1515;
        
        distance = distance * 1.609344;
        
        shops[i].distance = distance;
        console.log(shops[i].distance);


        if (nearestShop) {
            if (shops[i].distance < shops[i-1].distance) {
                nearestShop = shops[i].bairro;
                console.log(nearestShop);
                }
            } else {
            nearestShop = shops[i].bairro;
        }
    }
    console.log(nearestShop);
}


/* UNUSED



function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}
*/


