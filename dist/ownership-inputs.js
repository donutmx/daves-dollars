export function ownershipFromQuotes(home,annualTax,annualInsurance){
 if(!Number.isFinite(home.homePrice)||home.homePrice<=0)throw Error('Enter a target home price before applying annual quotes.');
 if(!Number.isFinite(annualTax)||annualTax<0||!Number.isFinite(annualInsurance)||annualInsurance<0)throw Error('Enter valid annual amounts, including zero when applicable.');
 const propertyTaxRate=annualTax/home.homePrice*100,homeInsurance=annualInsurance/12;
 if(propertyTaxRate>40||homeInsurance>1e9)throw Error('Check the quote amounts and target price; the resulting values exceed the supported range.');
 return {propertyTaxRate,homeInsurance};
}
