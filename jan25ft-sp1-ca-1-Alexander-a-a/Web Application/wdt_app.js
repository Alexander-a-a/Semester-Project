const MAX_STAFF_TOASTS = 6;
const MAX_DELIVERY_TOASTS = 6;

let manager;

let deliveryManager = {
  deliveryList: []
};

$(document).ready(function () {
  // Create a new instance of StaffManager once DOM is loaded
  manager = new StaffManager();

  // Function to proccess the staff data recived from API
function processData(staffData, manager) {
  manager.staffList = staffData; // Store the staff data in the managers staffList
  manager.renderStaffList(); // Update UI to display the data in the table
}
// Fetch staff data from the API 
manager.staffUserGet()
  .then((staffData) => {
    processData(staffData, manager);  // When data is fetched successfully process and display it
  })
  .catch((error) => {
    console.log(error) 
  })

})

// Stores the currently selected row 
let selectedRow = null;

// Highlight the clicked row and store it
function makeRowsClickable(tableBodyId) {
  const rows = document.querySelectorAll(`#${tableBodyId} tr`);
  rows.forEach(row => {
    row.addEventListener('click', function () {
      // Remove highlight from previous row
      if (selectedRow) {
        selectedRow.classList.remove('table-active');
      }
      // Highlight the new row
      selectedRow = this;
      selectedRow.classList.add('table-active');
    });
  });
}



// StaffManger class
class StaffManager {
  constructor() {
    this.staffList = [];
  }
  // Staff is out
  staffOut() {
      // Check if a row is selected
    if (!selectedRow) {
      alert("No row selected");
      return false;
    };
    // Check if the selected row is inside the staff table
    if(staffTableBody.contains(selectedRow)) {
      const duration = prompt("How long will employee be out (in minutes)")
      // Check if the input is empty or not a number
      if (duration === null || duration.trim() === "") {
        alert("Please enter a time (in minutes)!");
      } else if (isNaN(duration)) {
        alert("Please enter a number!")
        return false;
      } else {
          // Convert to number from string and calculate expected returntime
          const parsedDuration = parseInt(duration);
          const outTime = new Date()
          const expectedReturn = new Date(outTime);
          expectedReturn.setMinutes(outTime.getMinutes() + parsedDuration);
          // Format the expected return time as HH:MM
          const hours = expectedReturn.getHours().toString().padStart(2, "0");
          const minutes = expectedReturn.getMinutes().toString().padStart(2, "0");
          const formattedReturnTime = `${hours}:${minutes}`

          // Get the selected staff object based on index row and update the status/time
          const selectedStaff = selectedRow.rowIndex - 1;
          const staffMember = this.staffList[selectedStaff];

          // Set staff status to "Out"
          staffMember.status = "Out";
          // Save teh current out time
          staffMember.outTime = outTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          });
          // Convert minutes into hours and minutes
          const durationHours = Math.floor(parsedDuration / 60);
          const durationMinutes = parsedDuration % 60;

          // Format duration as HH:MM and store it
          const formattedDuration = `${durationHours}h ${durationMinutes}m`;
          staffMember.duration = formattedDuration;
          staffMember.expectedReturn = formattedReturnTime;

          // Refresh the thable in the  ui
          this.renderStaffList();
          
          // Clear the selected row
          selectedRow = null;

          
      }

    }
  }

  // Staff is in
  staffIn() {
    // Chek if row is selected if not alert
    if (!selectedRow) {
      alert("No row selected");
      return false;
    };
    if(staffTableBody.contains(selectedRow)) { 
      const selectedStaff = selectedRow.rowIndex - 1;
      const staffMember = this.staffList[selectedStaff];

      staffMember.status = "In";
      staffMember.outTime = "";
      staffMember.duration = "";
      staffMember.expectedReturn = ""
      staffMember.toastShown = false;

      this.renderStaffList();
    }
  }

  // Update DOM show all staff
  renderStaffList() {
    this.createTable() 
  }

  // Call API and convert to staff objects
  staffUserGet() {
    return new Promise((resolve, reject) => {
      $.get("https://sp1-api-8ynw.onrender.com/api?results=5", function (data) {
        const staffData = data.results.map((staffItem) => {
          return new StaffMember(
            staffItem.picture,
            staffItem.name,
            staffItem.surname,
            staffItem.email,
            "In", // default status 
            null, //outTime
            null, // duration
            null // expectedReturn
          );
        });
        // Resolve the promise with the staff array
        resolve(staffData);
      }).fail(function () {
        reject("Error fetching data");
      });
    });
  }

    // Generating the table with the js Objects
    createTable() {
      const tableBody = document.getElementById("staffTableBody");
      tableBody.innerHTML = ""; // clear existing rows

      this.staffList.forEach((staff) => {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = `${staff.name}`;


        const surNameCell = document.createElement("td");
        surNameCell.textContent = ` ${staff.surname}`;

        const emailCell = document.createElement("td");
        emailCell.textContent = staff.email;

        const statusCell = document.createElement("td");
        statusCell.textContent = staff.status;

        const outTimeCell = document.createElement("td");
        outTimeCell.textContent = staff.outTime;

        const durationCell = document.createElement("td");
        durationCell.textContent = staff.duration;

        const expectedReturnCell = document.createElement("td");
        expectedReturnCell.textContent = staff.expectedReturn;

        const pictureCell = document.createElement("td");
        const img = document.createElement("img");
        img.src = staff.picture;
        img.alt = `${staff.name} ${staff.surname}`;
        img.classList.add("staff-img")
        pictureCell.appendChild(img)

        // Append all cells to row
        row.appendChild(pictureCell);
        row.appendChild(nameCell);
        row.appendChild(surNameCell)
        row.appendChild(emailCell);
        row.appendChild(statusCell);
        row.appendChild(outTimeCell);
        row.appendChild(durationCell);
        row.appendChild(expectedReturnCell);

        // Append row to table body
        tableBody.appendChild(row);

        makeRowsClickable("staffTableBody");

      });

    }

}

// Employee class
class Employee {
  constructor(
    name,
    surname
  ) {
    this.name = name;
    this.surname = surname;
  }
}


// Staff fMember class
class StaffMember extends Employee {
  constructor(
    picture,
    name,
    surname,
    email,
    status,
    outTime,
    duration,
    expectedReturn,
  ) {
    super(name, surname);
    this.picture = picture;
    this.email = email;
    this.status = status;
    this.outTime = outTime;
    this.duration = duration;
    this.expectedReturn = expectedReturn;
    this.toastShown = false;
  }

  // Checking if staff member is late 
  staffMemberIsLate() {
    // Check if staff is out and has return time
    const staffStatus = this.status;
    const staffReturn = this.expectedReturn;

    // Prevent more than 5 staff toasts at once
    const staffStack = document.getElementById("toastStaffStackContainer");
    if (!staffStack || staffStack.childElementCount >= MAX_STAFF_TOASTS) return;

    // Continues only if staff is out and return time is set
    if (staffStatus === "Out" && staffReturn) {
      // Extract expected return time
      const extractedReturn = this.expectedReturn.split(":");
      const hour= parseInt(extractedReturn[0]);
      const minute = parseInt(extractedReturn[1]);

      // Create a new Date object for the expected return
      const now = new Date();
      const expectedReturnTime = new Date(now);
      const year = now.getFullYear();
      const month = now.getMonth();
      const date = now.getDate();
      expectedReturnTime.setFullYear(year);
      expectedReturnTime.setMonth(month);
      expectedReturnTime.setDate(date);
      expectedReturnTime.setHours(hour);
      expectedReturnTime.setMinutes(minute);
      
      // Check if staff is late
      if (now.getTime() >= expectedReturnTime.getTime()) {
        const diffMs = now.getTime() - expectedReturnTime.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMin / 60);
        const remainingMinutes = diffMin % 60;

        // Show toast only if they are late by at least one minute and not shown already
        if (diffMs >= 60000 && !this.toastShown) {
            this.toastShown = true;
              
              // Create the toast HTML structure dynamically with header, image, and content
              const createToast = document.createElement("div")
              createToast.innerHTML =  ` 
                      <div class="toastStaffContainer">
                        <div class="toast" role="alert" data-bs-autohide="false" aria-live="assertive" aria-atomic="true">
                          <div class="toast-header">
                            <button class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                          </div>
                          <img class="staffImg">
                          <div class="toast-staffBodyName">Name</div>
                          <div class="toast-staffBodyLate">Late</div>
                        </div>
                      </div>
                      `;

              // Append the toast to stack container
              const toastNode = createToast.firstElementChild;
              document.getElementById("toastStaffStackContainer").appendChild(toastNode);

              // Fill toast content with staff info
              const toastBodyName = toastNode.querySelector(".toast-staffBodyName");
              const toastBodyLate = toastNode.querySelector(".toast-staffBodyLate");
              const staffImage = toastNode.querySelector(".staffImg");
              const toastElement = toastNode.querySelector(".toast");

              // Update toast with staff members name, late duration and image
              toastBodyName.textContent = `${this.name} ${this.surname} is late!`;
              toastBodyLate.textContent = `Late by: ${diffHours}h ${remainingMinutes} minute(s)`;
              staffImage.src = this.picture

              // Show toast and remove it fro the DOM when closed
              const staffToastBootstrap = bootstrap.Toast.getOrCreateInstance(toastElement);
              toastElement.addEventListener("hidden.bs.toast", () => {
                toastNode.remove();
              });
              staffToastBootstrap.show();
          }
      }
    }
  }
}

function checkAllStaffLate() {
  manager.staffList.forEach( member => member.staffMemberIsLate());
}

// Update checkAllStaffLate every 1 second
setInterval(checkAllStaffLate, 1000); 




// Delivery Driver class
class DeliveryDriver extends Employee {
  constructor(
    vehicle,
    name,
    surname,
    telephone,
    deliveryAdress,
    returnTime
  ) {
    super(name, surname);
    this.vehicle = vehicle;
    this.telephone = telephone;
    this.deliveryAdress = deliveryAdress;
    this.returnTime = returnTime;
    this.toastShown = false;
  }


  deliveryDriverIsLate() {
    const deliveryReturnTime = this.returnTime;

    // Prevent more than 5 delivery toasts at once
    const deliveryStack = document.getElementById("deliveryToastStackContainer");
    if (deliveryStack.childElementCount >= MAX_DELIVERY_TOASTS) return;

    if (deliveryReturnTime) {
      // Extract expected return time
      const extractedReturn = this.returnTime.split(":");
      const hour = parseInt(extractedReturn[0]);
      const minute = parseInt(extractedReturn[1]);

      // Create a new Date object for the expected return
      const now = new Date();
      const expectedReturnTime = new Date(now);
      const year = now.getFullYear();
      const month = now.getMonth();
      const date = now.getDate();
      expectedReturnTime.setFullYear(year);
      expectedReturnTime.setMonth(month);
      expectedReturnTime.setDate(date);
      expectedReturnTime.setHours(hour);
      expectedReturnTime.setMinutes(minute);

      // Check if driver is late
      if (now.getTime() >= expectedReturnTime.getTime()) {
        const diffMs = now.getTime() - expectedReturnTime.getTime();
 

        // Show toast only if they are late by at least one minute and not shown already
        if (diffMs >= 60000 && !this.toastShown) {
          this.toastShown = true;

          // Create the toast HTML structure dynamically with header, and content
          const createDeliveryToast = document.createElement("div")
          createDeliveryToast.innerHTML = `
                <div class="deliveryToastContainer">
                  <div  class="toast" role="alert" data-bs-autohide="false" aria-live="assertive"
                    aria-atomic="true">
                    <div class="toast-header">
                      <button class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-deliveryBodyName"></div>
                    <div class="toast-deliveryBodyLate"></div>
                    <div class="toast-deliveryBodyNumber"></div>
                    <div class="toast-deliveryBodyAdress"></div>
                  </div>
                </div>
                `;

          // Append the toast to the stack container
          const toastNode = createDeliveryToast.firstElementChild;
          document.getElementById("deliveryToastStackContainer").appendChild(toastNode);

          // Fill toast with delivery driver info
          const deliveryBodyName = toastNode.querySelector(".toast-deliveryBodyName");
          const deliveryBodyLate = toastNode.querySelector(".toast-deliveryBodyLate");
          const deliveryBodyNumber = toastNode.querySelector(".toast-deliveryBodyNumber");
          const deliveryBodyAdress = toastNode.querySelector(".toast-deliveryBodyAdress");
          const toastElement = toastNode.querySelector(".toast");

          // Update toast with delivery drivers name, late duration, phonenumber and delivery adress
          deliveryBodyName.textContent = `${this.name} ${this.surname} is late!`;
          deliveryBodyLate.textContent = ` Return time was: ${this.returnTime}`;
          deliveryBodyNumber.textContent = `Phone number: ${this.telephone}`;
          deliveryBodyAdress.textContent = `Adress: ${this.deliveryAdress}`;

          const deliveryToastBootstrap = bootstrap.Toast.getOrCreateInstance(toastElement);
          toastElement.addEventListener("hidden.bs.toast", () => {
            toastNode.remove();
          });
          deliveryToastBootstrap.show();
        }
      }
    }
  }
}

function checkAllDeliveryDriversLate() {
  deliveryManager.deliveryList.forEach(driver => driver.deliveryDriverIsLate());
}

// Update checkAllDeliveryDriversLate every second
setInterval(checkAllDeliveryDriversLate, 1000);

// Validate the the inputs to the schedule delivery is a correct format
function validateDelivery() {
  const scheduleVehicleType = document.getElementById("scheduleVehicleType");
  const scheduleTableName = document.getElementById("scheduleName");
  const scheduleTableSurname = document.getElementById("scheduleSurname");
  const scheduleTableTelephone = document.getElementById("scheduleTelephone");
  const scheduleTableDeliveryAdress = document.getElementById("scheduleDeliveryAdress");
  const scheduleTableReturnTime = document.getElementById("scheduleReturnTime");

  // Saves the value in a new variable
  const scheduleVehicle = scheduleVehicleType.value;
  const scheduleName = scheduleTableName.value;
  const scheduleSurname = scheduleTableSurname.value;
  const scheduleTelephone = scheduleTableTelephone.value;
  const scheduleDeliveryAdress = scheduleTableDeliveryAdress.value;
  const scheduleReturnTime = scheduleTableReturnTime.value;

  // Check if any vehicle is selected if not alert
  if(scheduleVehicle === "" ) {
    alert("Please pick a vehicle type");
    return false;
  }


  // Changed to individual checks instead to make it easier for user to see whats wrong
  // Checking if name is a empty or contains a number
  if (scheduleName.trim() === "" || !isNaN(scheduleName) || /\d/.test(scheduleName)) {
    alert("Please enter a valid name");
    return false;
  }
  // Checking if surname is empty or contains a number
  if (scheduleSurname.trim() === "" || !isNaN(scheduleSurname) || /\d/.test(scheduleSurname)) {
    alert("Please enter a valid surname");
    return false;
  }

      // Checking if phone number is empty or not a number
  if (scheduleTelephone.trim() === "" ||  !/^\d+$/.test(scheduleTelephone)) {
    alert("Please enter a valid phone number");
    return false;
  }
  // Checking if delivery adress is empty 
  if (scheduleDeliveryAdress.trim() === "" ) {
    alert("Please enter a valid delivery adress");
    return false;
  }
  
    // Check return time has been selected
  if(scheduleReturnTime === "") {
    alert("Please select a time for the driver to return")
    return false;
  }
  // Check if the selected return time is in the past
  const checkReturnTime = scheduleReturnTime.split(":")
  const hour = parseInt(checkReturnTime[0]);
  const minute = parseInt(checkReturnTime[1]);
  const now = new Date();
  const returnTime = new Date();
  returnTime.setHours(hour, minute)

  if(returnTime < now) {
    alert("Please enter a valid time");
    return false;
  }

  
  return true;
  
}



// Add delivery function
function addDelivery() {
  if( validateDelivery() === true) {
    const scheduleVehicleType = document.getElementById("scheduleVehicleType");
    const scheduleTableName = document.getElementById("scheduleName");
    const scheduleTableSurname = document.getElementById("scheduleSurname");
    const scheduleTableTelephone = document.getElementById("scheduleTelephone");
    const scheduleTableDeliveryAdress = document.getElementById("scheduleDeliveryAdress");
    const scheduleTableReturnTime = document.getElementById("scheduleReturnTime");

      // Saves the value in a new variable
    const scheduleVehicle = scheduleVehicleType.value;
    const scheduleName = scheduleTableName.value;
    const scheduleSurname = scheduleTableSurname.value;
    const scheduleTelephone = scheduleTableTelephone.value;
    const scheduleDeliveryAdress = scheduleTableDeliveryAdress.value;
    const scheduleReturnTime = scheduleTableReturnTime.value;

    // Generate the table 
    const deliveryData = document.getElementById("deliveryBoardBody");
    let driver = new DeliveryDriver(scheduleVehicle, scheduleName, scheduleSurname, scheduleTelephone, scheduleDeliveryAdress, scheduleReturnTime);
    deliveryManager.deliveryList.push(driver);

        const row = document.createElement("tr");


        const vehicleCell = document.createElement("td");
        let icon = document.createElement("i");

        if (driver.vehicle === "car") {
          icon.className = "bi bi-car-front";
        } else if (driver.vehicle === "motorcycle") {
          icon.className = "bi bi-bicycle";
        } else {
          icon.className = "bi bi-question-circle";
        }

        vehicleCell.appendChild(icon);
        

        const nameCell = document.createElement("td");
        nameCell.textContent = `${driver.name}`;

        const surNameCell = document.createElement("td");
        surNameCell.textContent =  `${driver.surname}`;

        const telephoneCell = document.createElement("td");
        telephoneCell.textContent = driver.telephone;

        const adressCell = document.createElement("td");
        adressCell.textContent = driver.deliveryAdress;

        const returnTimeCell = document.createElement("td");
        returnTimeCell.textContent = driver.returnTime;



        // Append all cells to row
        row.appendChild(vehicleCell);
        row.appendChild(nameCell);
        row.appendChild(surNameCell) 
        row.appendChild(telephoneCell);
        row.appendChild(adressCell);
        row.appendChild(returnTimeCell);

        // Append row to table body
        deliveryData.appendChild(row);


        makeRowsClickable("deliveryBoardBody");
  }

}

// Clear delivery Board
function clearDeliveryBoard() {
  // Check if a row is selected
  if (!selectedRow) {
    alert("No row selected");
    return false;
  };
  // Check if the selected row is inside the delivery board
  if(deliveryBoardBody.contains(selectedRow)) {
    if (!confirm("Are you sure you want to remove this delivery?")) {
      return; // if user cancelled
    }

    const selectedIndex = selectedRow.rowIndex - 1;

    // remove from DOM
    selectedRow.remove();

    // Remove from array
    deliveryManager.deliveryList.splice(selectedIndex, 1);

    // Reset selection
    selectedRow = null;

  } else {
    alert("Please select a row in the delivery board");
    return false;
  }
  
}


// Time and Date
function digitalClock() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const dateString = now.toLocaleDateString("en-US", options);
  const timeString = now.toLocaleTimeString("en-US");

  document.getElementById("clock").textContent = `${dateString} ${timeString} `;
}

digitalClock();
setInterval(digitalClock, 1000);


// Remove the highlights from the tables when clicking anywhere on the page 
document.addEventListener("click", function (e) {
  const staffTable = document.getElementById("staffTableBody");
  const deliveryTable = document.getElementById("deliveryBoardBody");

  // If the clicked target is not inside either table
  if (!staffTable.contains(e.target) && !deliveryTable.contains(e.target)) {
    if (selectedRow) {
      selectedRow.classList.remove("table-active");
      selectedRow = null;
    }
  }
});