import { models, sequelize } from "./Sequelize-mysql.js";

async function initDb() {
  try {
    await sequelize.authenticate();
    console.log("Kết nối MySQL thành công");

    await sequelize.sync({ force: true}); //force true để xóa và tạo lại tất cả các bảng, có thể thay đổi thành false nếu không muốn xóa dữ liệu cũ
    console.log("Tạo database thành công");

    // Tạo job_type
    const jobTypes = await models.JobType.bulkCreate([
      { job_type: "Full-time" },
      { job_type: "Part-time" },
    ]);

    // Tạo category
    const categories = await models.Category.bulkCreate([
      { name: "Web Development" },
      { name: "Graphic Illustration" },
      { name: "SEO Services" },
      { name: "Social Media Management" },
      { name: "Animation Design" },
      { name: "Content Creation" },
      { name: "E-commerce Solutions" },
      { name: "UI/UX Design" },
      { name: "Voice Acting" },
      { name: "Mobile App Development" },
      { name: "Video Editing" },
      { name: "Copywriting" },
      { name: "Game Development" },
      { name: "Interior Design" },
      { name: "Event Planning" }
    ]);


    // Tạo skills
    await models.Skills.bulkCreate([
      { name: "JavaScript" },
      { name: "Graphic Design" },
    ]);

    // Tạo user_account
    const users = await models.User.bulkCreate([
      {
        clerk_id: "user_1",
        country: "Việt Nam",
        registration_date: "2025-01-01",
        is_seller: true,
        user_role: "employer",
        is_banned: false,
      },
      {
        clerk_id: "user_2",
        country: "USA",
        registration_date: "2025-01-02",
        is_seller: true,
        user_role: "employer",
        is_banned: false,
      },
      {
        clerk_id: "user_3",
        country: "India",
        registration_date: "2025-01-03",
        is_seller: false,
        user_role: "seeker",
        is_banned: false,
      },
    ]);

    // Tạo gigs
    const gigs = await models.Gig.bulkCreate([
      {
        seller_clerk_id: users[0].clerk_id,
        category_id: categories[0].id,
        job_type_id: jobTypes[0].id,
        title: "Web Development Service",
        description: "Build a responsive website",
        starting_price: 200.0,
        delivery_time: 5,
        gig_image: "https://example.com/gig1.jpg",
        city: "Hanoi",
        country: "Việt Nam",
        status: "active",
      },
      {
        seller_clerk_id: users[0].clerk_id,
        category_id: categories[0].id,
        job_type_id: jobTypes[1].id,
        title: "API Integration",
        description: "Integrate APIs for your app",
        starting_price: 150.0,
        delivery_time: 3,
        gig_image: "https://example.com/gig2.jpg",
        city: "Hanoi",
        country: "Việt Nam",
        status: "active",
      },
      {
        seller_clerk_id: users[1].clerk_id,
        category_id: categories[1].id,
        job_type_id: jobTypes[0].id,
        title: "Graphic Design",
        description: "Create stunning visuals",
        starting_price: 100.0,
        delivery_time: 4,
        gig_image: "https://example.com/gig3.jpg",
        city: "New York",
        country: "USA",
        status: "active",
      },
    ]);

    // Tạo FAQ cho gig
    await models.GigFaq.bulkCreate([
      {
        gig_id: gigs[0].id,
        question: "What technologies do you use?",
        answer: "I use React, Node.js, and MySQL.",
      },
      {
        gig_id: gigs[1].id,
        question: "How long does it take?",
        answer: "Usually 3-5 days depending on requirements.",
      },
    ]);

    // Tạo orders
    await models.Order.bulkCreate([
      {
        gig_id: gigs[0].id,
        buyer_clerk_id: users[2].clerk_id,
        seller_clerk_id: users[0].clerk_id,
        order_status: "completed",
        total_price: 200.0,
        order_date: "2025-01-04",
        requirements: "Website for e-commerce, responsive, SEO ready",
      },
      {
        gig_id: gigs[2].id,
        buyer_clerk_id: users[2].clerk_id,
        seller_clerk_id: users[1].clerk_id,
        order_status: "pending",
        total_price: 100.0,
        order_date: "2025-01-05",
        requirements: "Logo design for new brand, modern style",
      },
    ]);

    // Tạo requirements cho order
    await models.GigRequirements.bulkCreate([
      {
        order_id: 1,
        requirement_text: "Please provide your website content and design preferences.",
        submitted_at: "2025-01-04"
      },
      {
        order_id: 2,
        requirement_text: "Please provide your brand guidelines and color preferences for the logo.",
        submitted_at: "2025-01-05"
      }
    ]);

    // Tạo reviews
    await models.Review.bulkCreate([
      {
        order_id: 1,
        gig_id: gigs[0].id,
        reviewer_clerk_id: users[2].clerk_id,
        rating: 5,
        comment: "Amazing web development service!",
      },
      {
        order_id: 2,
        gig_id: gigs[2].id,
        reviewer_clerk_id: users[2].clerk_id,
        rating: 4,
        comment: "Great graphic design!",
      },
    ]);

    // Tạo seeker_skills
    await models.SeekerSkill.bulkCreate([
      { clerk_id: users[2].clerk_id, skill_id: 1 }, // user_3 with JavaScript skill
      { clerk_id: users[2].clerk_id, skill_id: 2 }, // user_3 with Graphic Design skill
    ]);

    // Tạo companies
    const companies = await models.Company.bulkCreate([
      {
        clerk_id: users[0].clerk_id, // Associated with user_1
        company_name: "TechCorp VN",
        profile_description: "A leading tech company in Vietnam",
        establishment_date: "2020-01-01",
        company_website_url: "https://techcorp.vn",
        company_email: "contact@techcorp.vn",
        verified_at: "2020-02-01",
        location: "Hanoi, Vietnam",
      },
      {
        clerk_id: users[1].clerk_id, // Associated with user_2
        company_name: "DesignWorks USA",
        profile_description: "Creative design agency in the USA",
        establishment_date: "2018-05-15",
        company_website_url: "https://designworks.com",
        company_email: "info@designworks.com",
        verified_at: "2018-06-01",
        location: "New York, USA",
      },
    ]);

    // Tạo company_images
    await models.CompanyImage.bulkCreate([
      {
        company_id: companies[0].id, // Associated with TechCorp VN
        company_image: "https://example.com/techcorp_logo.jpg",
      },
      {
        company_id: companies[0].id, // Associated with TechCorp VN
        company_image: "https://example.com/techcorp_icon.jpg",
      },
      {
        company_id: companies[0].id, // Associated with TechCorp VN
        company_image: "https://example.com/techcorp_frame.jpg",
      },
      {
        company_id: companies[1].id, // Associated with DesignWorks USA
        company_image: "https://example.com/designworks_logo.jpg",
      },
    ]);

    // Tạo contact_forms
    await models.ContactForm.bulkCreate([
      {
        clerk_id: users[2].clerk_id, // Associated with user_3
        name: "Amit Sharma",
        email: "amit.sharma@example.com",
        message: "I would like to inquire about job opportunities.",
        submitted_at: "2025-01-06",
      },
      {
        clerk_id: null, // Guest user (no clerk_id)
        name: "John Doe",
        email: "john.doe@example.com",
        message: "I have a question about your services.",
        submitted_at: "2025-01-07",
      },
    ]);

    // Tạo experience_details
    await models.ExperienceDetail.bulkCreate([
      {
        clerk_id: users[2].clerk_id, // Associated with user_3
        certificate_degree_name: "Bachelor of Technology",
        major: "Computer Science",
        cgpa: 8.5,
        start_date: "2018-06-01",
        end_date: "2022-05-30",
        is_current_job: false,
        job_title: "Software Engineer Intern",
        company_name: "TechCorp VN",
        location: "Hanoi, Vietnam",
        description: "Developed web applications using React and Node.js",
      },
      {
        clerk_id: users[2].clerk_id, // Associated with user_3
        certificate_degree_name: "Master of Technology",
        major: "Software Engineering",
        cgpa: 9.0,
        start_date: "2022-06-01",
        end_date: null,
        is_current_job: true,
        job_title: "Software Engineer",
        company_name: "DesignWorks USA",
        location: "New York, USA",
        description: "Working on API integrations and UI design",
      },
    ]);

    console.log("Thêm dữ liệu mẫu thành công");
  } catch (err) {
    console.error("Lỗi khi khởi tạo database:", err.message);
    console.error("Stack trace:", err.stack);
  } finally {
    await sequelize.close();
  }
}

initDb();