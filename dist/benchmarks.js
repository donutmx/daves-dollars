// Dated public evidence, distinct from user inputs and illustrative assumptions.
export const BENCHMARK_SOURCES={
 censusIncome:{label:'Census · Income in the United States: 2024 (September 2025)',url:'https://www.census.gov/library/publications/2025/demo/p60-286.html'},
 censusHousing:{label:'Census · 2024 ACS housing costs (September 2025)',url:'https://www.census.gov/newsroom/press-releases/2025/acs-1-year-estimates.html'},
 homeSales:{label:'NAR · July 2026 existing-home sales',url:'https://www.nar.realtor/research-and-statistics/housing-statistics/existing-home-sales'},
 buyers:{label:'NAR · 2025 Profile of Home Buyers and Sellers',url:'https://www.nar.realtor/news/real-estate-news/nar-2025-profile-of-home-buyers-sellers-reveals-market-extremes'},
 mortgageRate:{label:'Freddie Mac · PMMS, September 10, 2026',url:'https://www.freddiemac.com/pmms'}
};
export const BENCHMARK_NOTES={
 gross:{lead:'Median U.S. household income:',value:'$83,730/year',tail:'2024 Census data.',source:'censusIncome'},
 homePrice:{lead:'Median U.S. existing-home sale price:',value:'$431,400',tail:'July 2026 NAR data; sold homes, not all households.',source:'homeSales'},
 down:{lead:'Median down payment among home buyers:',value:'19%',tail:'2025 NAR report (July 2024–June 2025 purchases).',source:'buyers'},
 currentHousing:{lead:'Median U.S. gross rent, including utilities:',value:'$1,487/month',tail:'2024 Census ACS data; renter households.',source:'censusHousing'},
 hoa:{lead:'Median monthly HOA/condo fee among paying owners:',value:'$135/month',tail:'2024 Census ACS data; use $0 if no fee applies.',source:'censusHousing'},
 interest:{lead:'Average U.S. 30-year fixed mortgage rate:',value:'6.76%',tail:'September 10, 2026 Freddie Mac data; an average, not a median or live quote.',source:'mortgageRate'},
 age:{lead:'Median first-time home-buyer age:',value:'40 years',tail:'2025 NAR report; context only, not the median age of all households.',source:'buyers'}
};
export const INPUT_EXPLANATIONS={
 homePrice:'The price of the home you want to buy, before closing costs. Enter the full purchase price, not the amount borrowed. The loan is calculated after your down payment.',
 availableCash:'The total cash you can start with for this purchase. It must cover the down payment, closing costs, and the cash you choose to keep untouched. For example, $100,000 could cover $70,000 down, $12,000 closing costs, and $18,000 retained. Do not include retirement balances unless you have deliberately planned and accounted for a withdrawal.',
 utilities:'Electricity, gas, water, sewer, and trash for the proposed home. Exclude phone and internet, which have their own field. Current housing in Budget already includes current utilities; this amount is only used for the proposed home.',
 groceries:'Food and nonalcoholic drinks bought to prepare at home. Put restaurant meals and delivery in Eating out. Exclude pet food and purchases already included under Shopping.',
 gas:'Fuel or charging costs for your vehicles. Exclude vehicle payments, insurance, and maintenance, which have separate fields.',
 daycare:'Childcare you pay for, such as daycare, after-school care, or a nanny. Include the household total; enter 0 if it does not apply.',
 eatingOut:'Restaurant meals, takeout, delivery, and coffee-shop spending. Exclude food you buy to prepare at home, which belongs under Groceries.',
 travel:'Trips and vacations, including fares and lodging. An annual travel plan can be entered as Annual in Budget and is divided by 12. Do not duplicate meals or fuel already budgeted elsewhere.',
 petExpenses:'Pet food, veterinary care, medication, grooming, and pet insurance. Spread irregular vet bills across the year. Exclude amounts already entered elsewhere.',
 onlineShopping:'Optional purchases online or in stores. Use this for spending not already covered by groceries, clothing, gifts, pet costs, or another category.',
 subscriptions:'Recurring services such as streaming, memberships, apps, and publications. Exclude phone and internet service. Divide annual renewals by 12 or select Annual in Budget.',
 phoneInternet:'Your household mobile phone and internet bills. These are separate from housing utilities in both the current and proposed plans.',
 personalCare:'Clothing, shoes, haircuts, and personal-care products. Exclude purchases already included under Shopping or Groceries.',
 gifts:'Gifts and charitable giving. Spread seasonal occasions across the year, or enter the annual amount in Budget.',
 misc:'Living costs that do not fit another category, such as transit, parking, or school supplies. Only enter costs not already counted elsewhere.',
 car1Payment:'The monthly loan or lease payment for your first vehicle. Do not include insurance, fuel, or maintenance. A debt balance belongs under Net worth, not here.',
 car2Payment:'The monthly loan or lease payment for your second vehicle. Use 0 if there is no payment. Other vehicle payments can be included in Other monthly debt payments.',
 car1Insurance:'Insurance premiums for the first vehicle, converted to monthly dollars. If a policy covers both cars, put the combined premium here and enter 0 for the second vehicle.',
 car2Insurance:'Insurance premiums for the second vehicle. Enter 0 if already included in the first vehicle’s policy amount.',
 carMaintenance:'Vehicle repairs, tires, servicing, registration, and inspection for all vehicles. Divide irregular yearly costs by 12, or choose Annual in Budget. Exclude loan payments and insurance.',
 healthInsurance:'The employee-paid health premium for the household. Enter it once even when deducted from your paycheck: this site starts from gross income, not the bank deposit. Employer-paid premiums are not your expense. This simplified tax estimate does not model pre-tax health benefits.',
 dentalVision:'Employee-paid dental and vision premiums. Enter them once and exclude premiums already included in Health insurance.',
 healthOOP:'Copays, prescriptions, deductibles, and other unreimbursed healthcare costs. Exclude insurance premiums and costs reimbursed from elsewhere.',
 lifeInsurance:'Your household’s life-insurance premiums. This pays a benefit under the policy terms if an insured person dies. Do not enter the insured benefit amount.',
 disabilityInsurance:'Your employee-paid premiums for disability-income protection. This can replace part of income during a qualifying disability. Exclude employer-paid premiums and amounts already counted elsewhere.'
};

BENCHMARK_SOURCES.bls={label:'BLS · 2024 Consumer Expenditures, table A (December 2025)',url:'https://www.bls.gov/news.release/cesan.nr0.htm'};
Object.assign(BENCHMARK_NOTES,{
 groceries:{lead:'Average food-at-home spending:',value:'$518.67/month',tail:'2024 BLS data ($6,224/year ÷ 12); consumer units, not a household median.',source:'bls'},
 eatingOut:{lead:'Average food-away-from-home spending:',value:'$328.75/month',tail:'2024 BLS data ($3,945/year ÷ 12); consumer units, not a median.',source:'bls'},
 gas:{lead:'Average gasoline spending:',value:'$200.92/month',tail:'2024 BLS data ($2,411/year ÷ 12); excludes EV charging and is not a median.',source:'bls'},
 car1Insurance:{lead:'Average total vehicle-insurance spending:',value:'$166.08/month',tail:'2024 BLS data ($1,993/year ÷ 12); per consumer unit across vehicles, not per vehicle or a median.',source:'bls'},
 car2Insurance:{lead:'Average total vehicle-insurance spending:',value:'$166.08/month',tail:'2024 BLS data ($1,993/year ÷ 12); all vehicles combined, not a second-vehicle median.',source:'bls'},
 healthInsurance:{lead:'Average health-insurance spending:',value:'$337.92/month',tail:'2024 BLS data ($4,055/year ÷ 12); consumer units, broader coverage mix than employer health premiums, not a median.',source:'bls'}
});
