// These affect commentary only. They never enter the financial calculations.
export const COACH_DEFAULTS={ramsey:true,carPaymentPct:15,emergencyMonths:3};
export function validateCoachSettings(settings){
 if(!settings||typeof settings.ramsey!=='boolean'||!Number.isFinite(settings.carPaymentPct)||settings.carPaymentPct<1||settings.carPaymentPct>50||!Number.isFinite(settings.emergencyMonths)||settings.emergencyMonths<1||settings.emergencyMonths>12)throw Error('The coach settings are invalid.');
 return settings;
}
