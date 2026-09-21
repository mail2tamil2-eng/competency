Competency Management – Screen-Wise UI Design
Overall User Flow
Level Master → Skill Master → Competency Framework → Competency Assignment → Course Assignment
________________________________________
Screen 1: Level Master
Page Title
Level Master
Purpose
Create and manage competency/skill proficiency levels.
Fields
Field	Type	Mandatory
Level Name	Text field	Yes
Description	Text area	Optional
Status	Active/Inactive	Yes
Level Listing
Level Name	Description	Status	Action
L1 – Beginner	Basic proficiency	Active	Edit / Delete
L2 – Intermediate	Moderate proficiency	Active	Edit / Delete
L3 – Advanced	Advanced proficiency	Active	Edit / Delete
Actions
•	+ Add Level
•	Edit
•	Delete
•	Search
•	Filter by Status
________________________________________
Screen 2: Skill Master
Page Title
Skill Master
Purpose
Create and manage individual skills that can be mapped to a competency framework.
Fields
Field	Type	Mandatory
Skill Name	Text field	Yes
Description	Text area	Optional
Status	Active/Inactive	Yes
Skill Listing
Skill Name	Description	Status	Action
Communication	Effective communication	Active	Edit / Delete
Leadership	Leadership capability	Active	Edit / Delete
Actions
•	+ Add Skill
•	Edit
•	Delete
•	Search
•	Filter
________________________________________
Screen 3: Competency Framework – Create
Page Title
Create Competency Framework
Step 1: Framework Details
Framework Name*
[ Enter Framework Name ]
Description
[ Enter Description ]
________________________________________
Step 2: Add Skills
Provide an Add Skill option.
Skill Mapping
Skill	Expected Level	Level Description	Course(s)	Action
Skill 1	L1	Description	Course A, Course B	Edit / Delete
Skill 2	L2	Description	Course C	Edit / Delete
Expected Level
Dropdown populated from Level Master.
Level Description
Display the description configured for the selected level, with an option to edit/override if required.
Course Mapping
Allow multiple courses to be mapped to each Skill + Expected Level combination.
+ Add Course
Courses can be:
•	Searched
•	Selected
•	Removed
Actions
•	+ Add Skill
•	Remove Skill
•	Edit Skill Mapping
•	Save as Draft
•	Save & Publish
•	Cancel
________________________________________
Screen 4: Competency Framework – Listing
Page Title
Competency Framework
Display all created frameworks.
Framework Name	Skills	Levels	Courses	Status	Action
Leadership Framework	5	L1–L3	8	Active	Edit / Delete / Assign
Sales Framework	4	L1–L3	6	Active	Edit / Delete / Assign
Skills Column
Show the number of mapped skills with a hyperlink.
Example:
5 Skills
Clicking the link opens the framework details.
Actions
•	Edit
•	Delete
•	Assign
________________________________________
Screen 5: Competency Framework – Details
When the user clicks the Framework Name or Skills hyperlink, display the complete framework configuration.
Header
Framework Name: Leadership Framework
Description: Framework description
Skill Mapping
Skill	Expected Level	Level Description	Mapped Courses
Communication	L2	Intermediate proficiency	Course A, Course B
Leadership	L3	Advanced proficiency	Course C, Course D
Decision Making	L2	Intermediate proficiency	Course E
Actions
•	Edit Framework
•	Delete Framework
•	Assign Competency
________________________________________
Screen 6: Competency Assignment
Page Title
Assign Competency
Section 1: Competency
Competency Framework*
[ Select Framework ]
Display selected framework details:
•	Framework Name
•	Number of Skills
•	Number of Levels
•	Number of Courses
________________________________________
Section 2: Enrolment Configuration
Enrolment Method*
Use radio buttons:
○ Manual
Admin assigns the competency to the applicable learners.
○ Self
Learners can enrol themselves in the competency.
________________________________________
Enrolment Type*
Use radio buttons:
○ Dynamic
Newly added learners who meet the configured assignment criteria will automatically be assigned the competency.
○ Static
Only learners who meet the configured criteria at the time of assignment will be assigned the competency.
________________________________________
Screen 7: Target Audience / Applicability
Section Title
Target Audience / Applicability
Optional
Use radio buttons:
○ Role + Department
Display:
•	Select Role
•	Select Department
○ Employee Group (Cohort)
Display:
•	Select Employee Group/Cohort
○ Employee (User)
Display:
•	Search Employee
•	Select one or multiple employees
○ Employee Criteria (Profile Field)
Display:
•	Select Profile Field
•	Select/Enter Criteria
•	Add Criteria
Example:
Department = Sales
Location = Mumbai
○ None
No specific learner criteria are configured.
________________________________________
Screen 8: Assignment Preview
Before final assignment, display a summary.
Assignment Summary
Configuration	Details
Competency Framework	Leadership Framework
Enrolment Method	Manual
Enrolment Type	Dynamic
Target Audience	Role + Department
Role	Manager
Department	Sales
Applicable Learners	125
Mapped Skills	5
Mapped Courses	8
Actions
Back | Save & Assign | Cancel
________________________________________
Screen 9: Assignment Confirmation
After successful assignment:
Success Message
Competency assigned successfully.
The competency has been assigned to 125 learners based on the configured enrolment and applicability settings.
Assignment Details
•	Competency Framework
•	Enrolment Method
•	Enrolment Type
•	Target Audience
•	Learner Count
•	Mapped Course Count
Actions:
•	View Assignment
•	Done
________________________________________
Course Assignment Logic
The system should follow this hierarchy:
Competency Framework
↓
Skill
↓
Expected Level
↓
Mapped Course(s)
↓
Enrolment & Target Audience Rules
↓
Applicable Learners
↓
Course Assignment
Dynamic Assignment
When a new learner is added to the configured Role, Department, Cohort, or other criteria:
Learner matches criteria → Competency automatically assigned → Relevant mapped courses assigned
Static Assignment
At the time of assignment:
Identify eligible learners → Assign competency → Assign relevant mapped courses
Any learner added later will not automatically receive the competency/courses unless a new assignment is initiated.

