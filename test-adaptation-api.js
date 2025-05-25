// Script to test the adaptation agent API
// Using dynamic import for node-fetch
import('node-fetch').then(({ default: fetch }) => {
  testAdaptationAPI(fetch)
    .then(() => console.log('\nTest completed'))
    .catch(error => console.error('Test failed:', error));
});

async function testAdaptationAPI(fetch) {
  try {
    // Step 1: Get a user ID
    console.log('Fetching users...');
    const usersResponse = await fetch('http://localhost:3000/api/users');
    const usersData = await usersResponse.json();

    if (!usersData.success || !usersData.users || usersData.users.length === 0) {
      console.error('No users found. Please create a user first.');
      return;
    }

    const userId = usersData.users[0]._id;
    console.log(`Using user ID: ${userId}`);

    // Step 2: Trigger the monitor agent
    console.log('\nTriggering monitor agent...');
    const monitorResponse = await fetch('http://localhost:3000/api/monitor/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });

    const monitorData = await monitorResponse.json();
    console.log('Monitor agent response:');
    console.log(JSON.stringify(monitorData, null, 2));

    // Step 3: Trigger the adaptation agent
    console.log('\nTriggering adaptation agent...');
    const adaptationResponse = await fetch('http://localhost:3000/api/adaptation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });

    const adaptationData = await adaptationResponse.json();
    console.log('Adaptation agent response:');
    console.log(JSON.stringify(adaptationData, null, 2));

    // Step 4: Check for adaptations
    if (adaptationData.success && adaptationData.result && adaptationData.result.adaptations) {
      const adaptations = adaptationData.result.adaptations;
      console.log(`\nNumber of adaptations: ${adaptations.length}`);

      if (adaptations.length > 0) {
        console.log('\nAdaptation details:');
        adaptations.forEach((adaptation, index) => {
          console.log(`\n[${index + 1}] ${adaptation.type}: ${adaptation.description}`);
        });

        console.log('\nAdaptation summary:');
        console.log(adaptationData.result.summary);
      } else {
        console.log('No adaptations were made. This could be because:');
        console.log('1. There are no issues that require adaptation');
        console.log('2. There is not enough data to make adaptations');
        console.log('3. The adaptation agent is not finding applicable scenarios');
      }
    } else {
      console.log('Failed to get adaptation results');
    }
  } catch (error) {
    console.error('Error testing adaptation API:', error);
  }
}

// The test is now run via the dynamic import at the top of the file
