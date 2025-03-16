import BASE_URL from "./constants.js";


async function getAll() {
    try {
        const response = await axios(BASE_URL);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

const amountInput = document.getElementById("amount");
const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");


const data = await getAll();
const conversion_rates = data.conversion_rates;

async function populateCurrencyOptions() {

    fromCurrency.innerHTML = '';
    toCurrency.innerHTML = '';

    Object.entries(conversion_rates).forEach(([currency]) => {
        const fromOption = document.createElement("option");
        fromOption.value = currency;
        fromOption.textContent = currency;
        fromCurrency.appendChild(fromOption);

        const toOption = document.createElement("option");
        toOption.value = currency;
        toOption.textContent = currency;
        toCurrency.appendChild(toOption);
    });
}

populateCurrencyOptions()

async function convert(){
   
    const amount = amountInput.value;
    const result = document.getElementById("result");

    const fromOptionValue = fromCurrency.value;
    const toOptionValue = toCurrency.value;

    const fromRate = conversion_rates[fromOptionValue]
    const toRate = conversion_rates[toOptionValue]

    const convertedAmount = ((amount * toRate) / fromRate).toFixed(2);

    result.innerText = `${amount} ${fromOptionValue} ≈ ${convertedAmount} ${toOptionValue}`
    
    
    
}

const convertBtn = document.getElementById("convertBtn");
convertBtn.addEventListener("click",convert)


