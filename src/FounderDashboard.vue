<script setup>
import { ref, onMounted } from 'vue';
import navbar from './navbar.vue';
import { db } from './Config/api_services.js';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const missions = ref([]);
const isLoading = ref(true);

onMounted(() => {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {

    if (user) {

      const q = query(collection(db, "Missions"), where("owner", "==", user.uid));
      
      onSnapshot(q, (snapshot) => {
        missions.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        isLoading.value = false;
      }, (error) => {
        console.error("Error fetching missions in real-time:", error);
        isLoading.value = false;
      });

    } else {
      // User is signed out.
      missions.value = [];
      isLoading.value = false;
    }
  });
});

const getStatusClass = (status) => {
  switch (status) {
    case 'Completed':
      return 'badge bg-success';
    case 'Active':
      return 'badge bg-secondary';
    case 'In Progress':
      return 'badge bg-warning text-dark';
    default:
      return 'badge bg-secondary';
  }
};
</script>

<template>
  <navbar/>
  <div class="container mt-5" style="padding-top: 80px;">
    <h1 class="mb-4">Founder Dashboard</h1>
    <p class="text-muted">Review and manage all your feedback missions.</p>

    <div v-if="isLoading" class="text-center">
      <div class="spinner-border" role="status"></div>
      <p class="mt-2">Loading missions...</p>
    </div>

    <div v-else-if="missions.length === 0" class="alert alert-info">
      You have not created any missions yet.
    </div>

    <table v-else class="table table-hover align-middle">
      <thead>
        <tr>
          <th scope="col">Mission Name</th>
          <th scope="col">Progress</th>
          <th scope="col">Status</th>
          <th scope="col">Days Left</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="mission in missions" :key="mission.id">
          <td>
            <router-link :to="'/dashboard/' + mission.id">
              <strong>{{ mission.name || 'Unnamed Mission' }}</strong>
            </router-link>
          </td>
          <td>
            <span class="badge bg-primary rounded-pill">
              {{ mission.submissionCount || 0 }} / {{ mission.num_testers }}
            </span>
          </td>
          <td>
            <span :class="getStatusClass(mission.status)">
              {{ mission.status }}
            </span>
          </td>
          <td>{{ mission.duration ? `${mission.duration} day(s)` : 'N/A' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table a {
  text-decoration: none;
}
.table a:hover {
  text-decoration: underline;
}
</style>