export interface PropertyFormData {
    propertyName: string
    propertyType: string
    propertyCategory: string
    businessType: string
    commencementYear: string
    registeringForSomeoneElse: boolean
    ownerIdForManager: string
    houseNumber: string
    streetName: string
    cityId: string
    cityName: string
    state: string
    lgaId: string
    lgaName: string
    areaOfficeId: string
    areaOfficeName: string
    totalUnits: string
    occupiedUnits: string
    totalAnnualRent: string
    floorArea: string
    yearBuilt: string
    numberOfFloors: string
    propertyDescription: string
}

export interface LocationData {
    cities: any[]
    lgas: any[]
    areaOffices: any[]
}
