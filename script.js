const cep = document.getElementById('cep');
const selectedShop = document.getElementById('selected-shop');
const productList = document.getElementById('product-list');
let discount = 10;
let nearestShop = "";


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
                    `<div>Loja mais próxima: ${nearestShop}</div>`;

                showProductsList();    
            })
            .catch(e => console.log("Erro: " + e.message))
        ;
    } else {
        selectedShop.innerHTML =
            `Por favor informe um CEP para pesquisa.`
    }
};

// list offers of the nearest shop
function showProductsList() {
    //clearProductsPage();
    const options = {
        method: 'GET',
        mode: 'cors',
        cache:'default'
    }
    
    fetch(`https://mercado.carrefour.com.br/api/catalog_system/pub/products/search?fq=${nearestShop}`, options)
        .then(response => response.json())
        .then(data => {

            productList.innerHTML = `
            <h3>Aproveite as ofertas desta loja</h3>`;
            
            for (let i in data) {
                const price = data[i].items[0].sellers[0].commertialOffer.ListPrice;
                const li = document.createElement("li");
                discount = generateRandomDiscount(10, 15);

                productList.appendChild(li).innerHTML = `
                <div class="product-box">
                    Cód: ${data[i].productId}<br />
                    ${data[i].productName}<br />
                    Marca: ${data[i].brand}<br />
                    Desconto: ${discount}%<br />
                    Preço: ${price.toFixed(2).toString().replace(".",",")}<br />
                    Oferta: ${parseFloat((price - ((price * discount)/100))).toFixed(2).toString().replace(".",",")}
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

function generateRandomDiscount(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
  }
