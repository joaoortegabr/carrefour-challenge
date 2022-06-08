const searchBtn = document.getElementById('search-button');
const cep = document.getElementById('cep');
const selectedShop = document.getElementById('selected-shop');
const productList = document.getElementById('product-list');
let nearestShop = "";

searchBtn.addEventListener('click', findShopByCep);

// search using Carrefour API
function findShopByCep() {

    const search = cep.value.replace('-', '');
    const options = {
        method: 'GET',
        mode:'cors',
        cache:'default'
    }
   
    if (cep.value.length == 9) {  

        fetch(`https://mercado.carrefour.com.br/api/checkout/pub/regions?country=BRA&postalCode=${search}`, options)
            .then(response => response.json())
            .then(data => {
               
                // Using this API, the first result is the nearest shop
                nearestShop = data[0].sellers[0].id;

                selectedShop.innerHTML = 
                    `<div>Loja mais próxima: <strong>${nearestShop}</strong></div>
                    <p>Endereço da loja, 389 - Bairro</p>`;

                showProductsList();    
            })
            .catch(e => console.log("Erro: " + e.message))
        ;
    } else {
        window.alert("Por favor informe um CEP para pesquisa.")
    }
};

// list offers of the nearest shop
function showProductsList() {
    clearProductsPage();
    const options = {
        method: 'GET',
        mode: 'cors',
        cache:'default'
    }
    
    fetch(`https://mercado.carrefour.com.br/api/catalog_system/pub/products/search?fq=${nearestShop}`, options)
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


function clearProductsPage() {
    productList.innerHTML = ``;
}

function generateRandomDiscount(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}
