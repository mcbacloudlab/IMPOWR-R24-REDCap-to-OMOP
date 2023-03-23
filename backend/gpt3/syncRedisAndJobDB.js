require("dotenv").config(); // Load environment variables from .env file
const Bull = require("bull");
const db = require("../db/mysqlConnection.cjs"); // Import the MySQL connection

const syncRedisAndJobDB = async () => {
  try {
    // Step 1: Connect to Bull queue and retrieve job IDs
    const getBullJobIds = async (queue) => {
      console.log("Retrieving job IDs from Bull queue...");
      // Retrieve all jobs in different statuses from the Bull queue
      const jobs = await queue.getJobs([
        "completed",
        "active",
        "waiting",
        "delayed",
        "failed",
      ]);

      // Extract job IDs from the job objects and convert them to integers
      const jobIds = jobs.map((job) => parseInt(job.id, 10));
      console.log("Job IDs retrieved from Bull queue:", jobIds);
      return jobIds;
    };

    // Step 2: Retrieve job IDs from the MySQL database using the imported connection pool
    const getMysqlJobIds = async () => {
      console.log("Retrieving job IDs from MySQL database...");
      const query = "SELECT jobId FROM jobs";
      try {
        const [rows, fields] = await db.promise().execute(query);
        const jobIds = rows.map((row) => row.jobId);
        console.log("Job IDs retrieved from MySQL database:", jobIds);
        return jobIds;
      } catch (err) {
        console.log("Error retrieving job IDs from MySQL database:", err);
        throw new Error("Error");
      }
    };

    // Step 4: Execute a MySQL DELETE query to remove the identified IDs using the imported connection pool
    const removeMysqlJobIds = async (jobIdsToRemove) => {
      if (jobIdsToRemove.length === 0) {
        console.log("No job IDs to remove from MySQL database.");
        return;
      }
      console.log("Removing job IDs from MySQL database:", jobIdsToRemove);
      const query = "DELETE FROM jobs WHERE jobId IN (?)";
      try {
        await db.promise().query(query, [jobIdsToRemove]);
        console.log("Job IDs removed from MySQL database:", jobIdsToRemove);
      } catch (err) {
        console.log("Error removing job IDs from MySQL database:", err);
        throw new Error("Error");
      }
    };
    (async () => {
      try {
        // Create a Bull queue
        const myQueue = new Bull("process-queue", {
          redis: {
            host: "localhost",
            port: 6379,
          },
        });

        // Get job IDs from Bull queue
        const bullJobIds = new Set(await getBullJobIds(myQueue));

        // Get job IDs from MySQL using the imported connection
        const mysqlJobIds = await getMysqlJobIds();

        // Step 3: Identify job IDs that need to be removed from MySQL
        const jobIdsToRemove = mysqlJobIds.filter(
          (jobId) => !bullJobIds.has(jobId)
        );

        // Remove job IDs from MySQL using the imported connection
        await removeMysqlJobIds(jobIdsToRemove);

        console.log("Finished processing job IDs.");
      } catch (err) {
        console.error("An error occurred:", err);
      }
    })();
    console.log("Task executed successfully");
  } catch (error) {
    console.error("An error occurred while executing the task:", err);
  }
};

// Export the task function
module.exports = syncRedisAndJobDB;
