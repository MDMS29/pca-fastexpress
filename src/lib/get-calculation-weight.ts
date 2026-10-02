export const getCalculationWeight = (weight: number): number | null => {
    if (weight > 0.01 && weight <= 5) return 2 ;
    if (weight > 5 && weight <= 20) return 4;
    return null;
}
