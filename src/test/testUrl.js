const { fetch } = require("undici");


let resp = {};
try {
    fetch('https://advpl.ds.dta.totvs.ai/api/v1/health_check', {
        method: "GET"
    }).then((resp) => {
        console.log(resp);
    })

} catch (error) {
    console.error(error);

}
