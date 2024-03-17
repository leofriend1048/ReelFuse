import { Text } from "@tremor/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"



export default async function LastUpdate() {
  let url = new URL(
    `https://api.us-east.tinybird.co/v0/pipes/northbeam_last_update.json`
  );

  const result = await fetch(url, {
    headers: {
      Authorization:
        'Bearer p.eyJ1IjogImI1M2FlMWJmLTRjN2ItNGY3Mi1iNThmLWYyOTBhNzNjM2QxNyIsICJpZCI6ICJkNmRhNmJjNy05ZjhhLTRhNDktYmY3Ni1lZGJhZjIwYThmYmYiLCAiaG9zdCI6ICJ1c19lYXN0In0.UzFFszKFWt_mKjSYUbnKkJAj0M3jjDmYNVj6sCoPvx8',
    },
  })
    .then((r) => r.json())
    .then((r) => r)
    .catch((e) => e.toString());

  if (!result.data) {
    console.error(`There is a problem running the query: ${result}`);
  } else {
    console.table(result.data);
    console.log("** Query columns **");
    for (let column of result.meta) {
      console.log(`${column.name} -> ${column.type}`);
    }

    // Extract timestamp value
    const timestamp = result.data[0].timestamp; // Replace with the actual property name

    // Function to convert timestamp to "MMM DD @ hh:mm AM/PM" format in EST
    const convertToESTFormat = (timestamp) => {
      const dateUTC = new Date(timestamp);
      const dateEST = new Date(dateUTC);
      dateEST.setHours(dateUTC.getHours() - 5); // Subtract 5 hours for EST

      const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(dateEST);
      const day = dateEST.getDate();
      const hours = dateEST.getHours();
      const minutes = dateEST.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 === 0 ? 12 : hours % 12;

      // Construct the formatted time string
      const formattedTime = `${month} ${day} @ ${formattedHours}:${minutes < 10 ? '0' : ''}${minutes} ${ampm} EST`;

      return formattedTime;
    };

    // Convert timestamp to EST 12-hour format
    const formattedTime = convertToESTFormat(timestamp);



    return (
      <Alert className="w-48">
      <AlertTitle>Last Processed:</AlertTitle>
      <AlertDescription>
      {formattedTime}
      </AlertDescription>
    </Alert>
    );
  }
}
