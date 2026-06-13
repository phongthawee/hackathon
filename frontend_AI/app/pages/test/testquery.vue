<template>
    <div>

    </div>
</template>

<script setup lang="ts">
const { getDoctors, getHospitalLocations } = useTest()

const doctors = await getDoctors()
const hospitalLocations = await getHospitalLocations()

console.log("doctors", doctors)

</script>

<style scoped>

</style>