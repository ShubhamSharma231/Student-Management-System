// ===============================
// LOGIN PROTECTION
// ===============================

if (sessionStorage.getItem("isLoggedIn") !== "true") {
    window.location.replace("login.html");
}


// ===============================
// API
// ===============================

const API_URL = "http://localhost:5000/students";


// ===============================
// GET AUTH TOKEN
// ===============================

function getAuthToken() {
    return sessionStorage.getItem("authToken");
}


// ===============================
// AUTHENTICATED FETCH
// ===============================

async function authFetch(url, options = {}) {

    const token = getAuthToken();

    if (!token) {
        sessionStorage.removeItem("isLoggedIn");
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("username");

        window.location.replace("login.html");

        throw new Error("Authentication token not found.");
    }


    const headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
    };


    const response = await fetch(url, {
        ...options,
        headers: headers
    });


    // Token expired or invalid
    if (response.status === 401 || response.status === 403) {

        sessionStorage.removeItem("isLoggedIn");
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("username");

        alert("Your session has expired. Please login again.");

        window.location.replace("login.html");

        throw new Error("Authentication failed.");
    }


    return response;
}


// ===============================
// ELEMENTS
// ===============================

const studentForm =
    document.getElementById("studentForm");

const studentsList =
    document.getElementById("studentsList");

let allStudents = [];

let currentPage = 1;

const studentsPerPage = 5;


// ===============================
// LOAD STUDENTS
// ===============================

async function loadStudents() {

    try {

        const response =
            await authFetch(API_URL);


        if (!response.ok) {
            throw new Error("Failed to load students");
        }


        allStudents =
            await response.json();


        populateCourseFilter();

        applyFilters();


    } catch (error) {

        console.error(
            "Error loading students:",
            error
        );

    }

}


// ===============================
// DISPLAY STUDENTS
// ===============================

function displayStudents(students) {

    if (!studentsList) {
        return;
    }


    studentsList.innerHTML = "";


    if (students.length === 0) {

        studentsList.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    No students found
                </td>
            </tr>
        `;

        return;
    }


    students.forEach(function(student) {

        studentsList.innerHTML += `
            <tr>

                <td>${student.id}</td>

                <td>${student.name}</td>

                <td>${student.email}</td>

                <td>${student.phone}</td>

                <td>${student.course}</td>

                <td>${student.year}</td>

                <td>

                    <button
                        class="view-btn"
                        onclick="viewStudent(${student.id})"
                    >
                        View
                    </button>

                    <button
                        class="edit-btn"
                        onclick="editStudent(${student.id})"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteStudent(${student.id})"
                    >
                        Delete
                    </button>

                </td>

            </tr>
        `;

    });

}


// ===============================
// COURSE FILTER
// ===============================

function populateCourseFilter() {

    const courseFilter =
        document.getElementById("courseFilter");


    if (!courseFilter) {
        return;
    }


    const selectedCourse =
        courseFilter.value;


    const courses = [];


    allStudents.forEach(function(student) {

        if (
            student.course &&
            !courses.includes(student.course)
        ) {

            courses.push(student.course);

        }

    });


    courses.sort();


    courseFilter.innerHTML = `
        <option value="">
            All Courses
        </option>
    `;


    courses.forEach(function(course) {

        courseFilter.innerHTML += `
            <option value="${course}">
                ${course}
            </option>
        `;

    });


    courseFilter.value = selectedCourse;

}


// ===============================
// GET FILTERED STUDENTS
// ===============================

function getFilteredStudents() {

    const searchInput =
        document.getElementById("searchInput");

    const courseFilter =
        document.getElementById("courseFilter");

    const yearFilter =
        document.getElementById("yearFilter");

    const sortFilter =
        document.getElementById("sortFilter");


    const searchText =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";


    const selectedCourse =
        courseFilter
            ? courseFilter.value
            : "";


    const selectedYear =
        yearFilter
            ? yearFilter.value
            : "";


    const selectedSort =
        sortFilter
            ? sortFilter.value
            : "";


    let filteredStudents =
        allStudents.filter(function(student) {

            const searchMatch =
                searchText === "" ||

                String(student.name)
                    .toLowerCase()
                    .includes(searchText) ||

                String(student.email)
                    .toLowerCase()
                    .includes(searchText) ||

                String(student.phone)
                    .toLowerCase()
                    .includes(searchText) ||

                String(student.course)
                    .toLowerCase()
                    .includes(searchText);


            const courseMatch =
                selectedCourse === "" ||
                student.course === selectedCourse;


            const yearMatch =
                selectedYear === "" ||
                String(student.year) === selectedYear;


            return (
                searchMatch &&
                courseMatch &&
                yearMatch
            );

        });


    // ===============================
    // SORT
    // ===============================

    if (selectedSort === "idAsc") {

        filteredStudents.sort(
            (a, b) => a.id - b.id
        );

    }

    else if (selectedSort === "idDesc") {

        filteredStudents.sort(
            (a, b) => b.id - a.id
        );

    }

    else if (selectedSort === "nameAsc") {

        filteredStudents.sort(
            (a, b) =>
                String(a.name)
                    .toLowerCase()
                    .localeCompare(
                        String(b.name).toLowerCase()
                    )
        );

    }

    else if (selectedSort === "nameDesc") {

        filteredStudents.sort(
            (a, b) =>
                String(b.name)
                    .toLowerCase()
                    .localeCompare(
                        String(a.name).toLowerCase()
                    )
        );

    }

    else if (selectedSort === "yearAsc") {

        filteredStudents.sort(
            (a, b) =>
                Number(a.year) - Number(b.year)
        );

    }

    else if (selectedSort === "yearDesc") {

        filteredStudents.sort(
            (a, b) =>
                Number(b.year) - Number(a.year)
        );

    }

    else if (selectedSort === "courseAsc") {

        filteredStudents.sort(
            (a, b) =>
                String(a.course)
                    .toLowerCase()
                    .localeCompare(
                        String(b.course).toLowerCase()
                    )
        );

    }

    else if (selectedSort === "courseDesc") {

        filteredStudents.sort(
            (a, b) =>
                String(b.course)
                    .toLowerCase()
                    .localeCompare(
                        String(a.course).toLowerCase()
                    )
        );

    }


    return filteredStudents;

}


// ===============================
// APPLY FILTERS
// ===============================

function applyFilters() {

    const filteredStudents =
        getFilteredStudents();


    const totalPages =
        Math.ceil(
            filteredStudents.length /
            studentsPerPage
        );


    if (
        totalPages > 0 &&
        currentPage > totalPages
    ) {

        currentPage = totalPages;

    }


    if (totalPages === 0) {

        currentPage = 1;

    }


    const startIndex =
        (currentPage - 1) *
        studentsPerPage;


    const endIndex =
        startIndex +
        studentsPerPage;


    const pageStudents =
        filteredStudents.slice(
            startIndex,
            endIndex
        );


    displayStudents(pageStudents);

    updatePagination(totalPages);

}


// ===============================
// PAGINATION
// ===============================

function updatePagination(totalPages) {

    const pageInfo =
        document.getElementById("pageInfo");

    const prevPage =
        document.getElementById("prevPage");

    const nextPageButton =
        document.getElementById("nextPage");


    if (!pageInfo) {
        return;
    }


    if (totalPages === 0) {

        pageInfo.textContent = "Page 0";


        if (prevPage) {
            prevPage.disabled = true;
        }


        if (nextPageButton) {
            nextPageButton.disabled = true;
        }


        return;

    }


    pageInfo.textContent =
        `Page ${currentPage} of ${totalPages}`;


    if (prevPage) {

        prevPage.disabled =
            currentPage === 1;

    }


    if (nextPageButton) {

        nextPageButton.disabled =
            currentPage === totalPages;

    }

}


// ===============================
// NEXT PAGE
// ===============================

function nextPage() {

    const filteredStudents =
        getFilteredStudents();


    const totalPages =
        Math.ceil(
            filteredStudents.length /
            studentsPerPage
        );


    if (currentPage < totalPages) {

        currentPage++;

        applyFilters();

    }

}


// ===============================
// PREVIOUS PAGE
// ===============================

function previousPage() {

    if (currentPage > 1) {

        currentPage--;

        applyFilters();

    }

}


// ===============================
// CLEAR FILTERS
// ===============================

function clearFilters() {

    const searchInput =
        document.getElementById("searchInput");

    const courseFilter =
        document.getElementById("courseFilter");

    const yearFilter =
        document.getElementById("yearFilter");

    const sortFilter =
        document.getElementById("sortFilter");


    if (searchInput) {
        searchInput.value = "";
    }


    if (courseFilter) {
        courseFilter.value = "";
    }


    if (yearFilter) {
        yearFilter.value = "";
    }


    if (sortFilter) {
        sortFilter.value = "";
    }


    currentPage = 1;

    applyFilters();

}


// ===============================
// VIEW STUDENT
// ===============================

async function viewStudent(id) {

    try {

        const response =
            await authFetch(
                `${API_URL}/${id}`
            );


        if (!response.ok) {

            throw new Error(
                "Student not found"
            );

        }


        const student =
            await response.json();


        const viewId =
            document.getElementById("viewId");

        const viewName =
            document.getElementById("viewName");

        const viewEmail =
            document.getElementById("viewEmail");

        const viewPhone =
            document.getElementById("viewPhone");

        const viewCourse =
            document.getElementById("viewCourse");

        const viewYear =
            document.getElementById("viewYear");

        const viewCreatedAt =
            document.getElementById("viewCreatedAt");


        if (viewId) {
            viewId.textContent = student.id;
        }


        if (viewName) {
            viewName.textContent = student.name;
        }


        if (viewEmail) {
            viewEmail.textContent = student.email;
        }


        if (viewPhone) {
            viewPhone.textContent = student.phone;
        }


        if (viewCourse) {
            viewCourse.textContent = student.course;
        }


        if (viewYear) {
            viewYear.textContent = student.year;
        }


        if (viewCreatedAt) {

            viewCreatedAt.textContent =
                student.created_at
                    ? new Date(
                        student.created_at
                    ).toLocaleString()
                    : "N/A";

        }


        const modal =
            document.getElementById(
                "studentModal"
            );


        if (modal) {

            modal.style.display = "flex";

        }


    } catch (error) {

        console.error(
            "Error viewing student:",
            error
        );

        alert(
            "Error loading student details."
        );

    }

}


// ===============================
// CLOSE STUDENT MODAL
// ===============================

function closeStudentModal() {

    const modal =
        document.getElementById(
            "studentModal"
        );


    if (modal) {

        modal.style.display = "none";

    }

}


// ===============================
// ADD STUDENT
// ===============================

if (studentForm) {

    studentForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const name =
                document
                    .getElementById("name")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const phone =
                document
                    .getElementById("phone")
                    .value
                    .trim();


            const course =
                document
                    .getElementById("course")
                    .value
                    .trim();


            const year =
                Number(
                    document
                        .getElementById("year")
                        .value
                );


            if (!/^[0-9]{10}$/.test(phone)) {

                alert(
                    "Please enter a valid 10-digit phone number."
                );

                return;

            }


            if (year < 1 || year > 4) {

                alert(
                    "Year must be between 1 and 4."
                );

                return;

            }


            try {

                const response =
                    await authFetch(
                        API_URL,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    name: name,

                                    email: email,

                                    phone: phone,

                                    course: course,

                                    year: year

                                })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.error ||
                        data.message ||
                        "Error adding student."
                    );

                    return;

                }


                alert(
                    data.message ||
                    "Student added successfully!"
                );


                studentForm.reset();

                currentPage = 1;

                await loadStudents();

                await updateDashboard();


            } catch (error) {

                console.error(
                    "Error adding student:",
                    error
                );

                alert(
                    "Error adding student."
                );

            }

        }
    );

}


// ===============================
// EDIT STUDENT
// ===============================

async function editStudent(id) {

    try {

        const response =
            await authFetch(
                `${API_URL}/${id}`
            );


        if (!response.ok) {

            throw new Error(
                "Student not found"
            );

        }


        const student =
            await response.json();


        const editId =
            document.getElementById("editId");

        const editName =
            document.getElementById("editName");

        const editEmail =
            document.getElementById("editEmail");

        const editPhone =
            document.getElementById("editPhone");

        const editCourse =
            document.getElementById("editCourse");

        const editYear =
            document.getElementById("editYear");

        const editContainer =
            document.getElementById(
                "editFormContainer"
            );

        const addContainer =
            document.getElementById(
                "studentFormContainer"
            );


        if (editId) {
            editId.value = student.id;
        }


        if (editName) {
            editName.value = student.name;
        }


        if (editEmail) {
            editEmail.value = student.email;
        }


        if (editPhone) {
            editPhone.value = student.phone;
        }


        if (editCourse) {
            editCourse.value = student.course;
        }


        if (editYear) {
            editYear.value = student.year;
        }


        if (addContainer) {

            addContainer.style.display =
                "none";

        }


        if (editContainer) {

            editContainer.style.display =
                "block";


            editContainer.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }


    } catch (error) {

        console.error(
            "Error editing student:",
            error
        );

        alert(
            "Error loading student."
        );

    }

}


// ===============================
// UPDATE STUDENT
// ===============================

const editStudentForm =
    document.getElementById(
        "editStudentForm"
    );


if (editStudentForm) {

    editStudentForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const id =
                document
                    .getElementById("editId")
                    .value;


            const name =
                document
                    .getElementById("editName")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("editEmail")
                    .value
                    .trim();


            const phone =
                document
                    .getElementById("editPhone")
                    .value
                    .trim();


            const course =
                document
                    .getElementById("editCourse")
                    .value
                    .trim();


            const year =
                Number(
                    document
                        .getElementById("editYear")
                        .value
                );


            if (!id) {

                alert(
                    "Student ID is missing."
                );

                return;

            }


            if (!/^[0-9]{10}$/.test(phone)) {

                alert(
                    "Please enter a valid 10-digit phone number."
                );

                return;

            }


            if (year < 1 || year > 4) {

                alert(
                    "Year must be between 1 and 4."
                );

                return;

            }


            try {

                const response =
                    await authFetch(
                        `${API_URL}/${id}`,
                        {

                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    name: name,

                                    email: email,

                                    phone: phone,

                                    course: course,

                                    year: year

                                })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.error ||
                        data.message ||
                        "Error updating student."
                    );

                    return;

                }


                alert(
                    data.message ||
                    "Student updated successfully!"
                );


                cancelEdit();

                await loadStudents();

                await updateDashboard();


            } catch (error) {

                console.error(
                    "Error updating student:",
                    error
                );

                alert(
                    "Error updating student."
                );

            }

        }
    );

}


// ===============================
// CANCEL EDIT
// ===============================

function cancelEdit() {

    const form =
        document.getElementById(
            "editStudentForm"
        );


    if (form) {
        form.reset();
    }


    const editContainer =
        document.getElementById(
            "editFormContainer"
        );

    const addContainer =
        document.getElementById(
            "studentFormContainer"
        );


    if (editContainer) {

        editContainer.style.display =
            "none";

    }


    if (addContainer) {

        addContainer.style.display =
            "block";

    }

}


// ===============================
// DELETE STUDENT
// ===============================

async function deleteStudent(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this student?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const response =
            await authFetch(
                `${API_URL}/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                data.message ||
                "Error deleting student."
            );

            return;

        }


        alert(
            data.message ||
            "Student deleted successfully!"
        );


        await loadStudents();

        await updateDashboard();


    } catch (error) {

        console.error(
            "Error deleting student:",
            error
        );

        alert(
            "Error deleting student."
        );

    }

}


// ===============================
// DASHBOARD
// ===============================

async function updateDashboard() {

    try {

        const response =
            await authFetch(API_URL);


        if (!response.ok) {

            throw new Error(
                "Failed to load dashboard"
            );

        }


        const students =
            await response.json();


        const totalStudents =
            document.getElementById(
                "totalStudents"
            );

        const totalCourses =
            document.getElementById(
                "totalCourses"
            );

        const totalYears =
            document.getElementById(
                "totalYears"
            );


        if (totalStudents) {

            totalStudents.textContent =
                students.length;

        }


        const courses =
            new Set(
                students.map(
                    student =>
                        student.course
                )
            );


        if (totalCourses) {

            totalCourses.textContent =
                courses.size;

        }


        const years =
            new Set(
                students.map(
                    student =>
                        student.year
                )
            );


        if (totalYears) {

            totalYears.textContent =
                years.size;

        }


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}


// ===============================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ===============================

window.addEventListener(
    "click",
    function(event) {

        const modal =
            document.getElementById(
                "studentModal"
            );


        if (
            modal &&
            event.target === modal
        ) {

            closeStudentModal();

        }

    }
);


// ===============================
// ESC KEY - CLOSE MODAL
// ===============================

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Escape") {

            closeStudentModal();

        }

    }
);


// ===============================
// SEARCH EVENTS
// ===============================

const searchInput =
    document.getElementById(
        "searchInput"
    );

const courseFilter =
    document.getElementById(
        "courseFilter"
    );

const yearFilter =
    document.getElementById(
        "yearFilter"
    );

const sortFilter =
    document.getElementById(
        "sortFilter"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        function() {

            currentPage = 1;

            applyFilters();

        }
    );

}


if (courseFilter) {

    courseFilter.addEventListener(
        "change",
        function() {

            currentPage = 1;

            applyFilters();

        }
    );

}


if (yearFilter) {

    yearFilter.addEventListener(
        "change",
        function() {

            currentPage = 1;

            applyFilters();

        }
    );

}


if (sortFilter) {

    sortFilter.addEventListener(
        "change",
        function() {

            currentPage = 1;

            applyFilters();

        }
    );

}


// ===============================
// LOGOUT
// ===============================

function logout() {

    sessionStorage.removeItem(
        "isLoggedIn"
    );

    sessionStorage.removeItem(
        "authToken"
    );

    sessionStorage.removeItem(
        "username"
    );


    window.location.replace(
        "login.html"
    );

}


// ===============================
// START APPLICATION
// ===============================

loadStudents();

updateDashboard();