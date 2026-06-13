<template>
    <div>

    </div>
</template>

<script setup lang="ts">
import type { AppGetResponse } from '~/model/appointments/response/app_get_res'

const { getDoctors, getHospitalLocations } = useTest()
const { fetchAppointments } = useAppointments()
const {fetchLocation} = useLocation()
const doctors = await getDoctors() 
const hospitalLocations = await getHospitalLocations()
const appointments = await fetchAppointments() as AppGetResponse[]


console.log("doctors", doctors)
console.log("hospitalLocations", hospitalLocations)
console.log("appointments", appointments)

const locations = await fetchLocation()
console.log("locations", locations)

</script>

<style scoped>

</style>