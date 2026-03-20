import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up (development only) — order matters for FK constraints in PostgreSQL
  await prisma.studentProgress.deleteMany();
  await prisma.recording.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  // Create teacher
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@elsa.com',
      name: 'Ms. Sarah Johnson',
      password: teacherPassword,
      role: 'TEACHER',
      teacherProfile: { create: {} },
    },
    include: { teacherProfile: true },
  });
  console.log('✅ Teacher created:', teacher.email);

  // Create students
  const studentEmails = ['alex@elsa.com', 'maya@elsa.com', 'chris@elsa.com', 'diana@elsa.com', 'james@elsa.com'];
  const studentNames = ['Alex Rivera', 'Maya Patel', 'Chris Park', 'Diana Torres', 'James Wilson'];
  const studentPassword = await bcrypt.hash('student123', 10);
  type StudentWithProfile = Prisma.UserGetPayload<{ include: { studentProfile: true } }>;
  const createdStudents: StudentWithProfile[] = [];

  for (let i = 0; i < studentEmails.length; i++) {
    const student = await prisma.user.create({
      data: {
        email: studentEmails[i],
        name: studentNames[i],
        password: studentPassword,
        role: 'STUDENT',
        studentProfile: {
          create: {
            score: Math.round(60 + Math.random() * 35),
            lessonsDone: Math.floor(Math.random() * 30),
            practiceMin: Math.floor(Math.random() * 200) + 20,
            streak: Math.floor(Math.random() * 15),
          },
        },
      },
      include: { studentProfile: true },
    });
    createdStudents.push(student);
  }
  console.log('✅ Students created:', studentEmails.length);

  // Create Class
  const engClass = await prisma.class.create({
    data: {
      name: 'Advanced English Communication',
      description: 'Intensive speaking and pronunciation course for intermediate learners.',
      teacherId: teacher.teacherProfile!.id,
    },
  });

  // Enroll students
  for (const student of createdStudents) {
    await prisma.studentProfile.update({
      where: { id: student.studentProfile!.id },
      data: { classId: engClass.id },
    });
  }
  console.log('✅ Class created and students enrolled');

  // ============================================================
  // LESSONS
  // ============================================================
  const lessons = [
    { title: 'Everyday Pronunciation Basics', difficulty: 'BEGINNER' as const, topic: 'pronunciation' },
    { title: 'Restaurant & Food Vocabulary', difficulty: 'BEGINNER' as const, topic: 'restaurant' },
    { title: 'Business English Fundamentals', difficulty: 'INTERMEDIATE' as const, topic: 'business' },
    { title: 'Travel & Air Travel English', difficulty: 'INTERMEDIATE' as const, topic: 'travel' },
    { title: 'Advanced Fluency & Intonation', difficulty: 'ADVANCED' as const, topic: 'fluency' },
    { title: 'Job Interview Mastery', difficulty: 'ADVANCED' as const, topic: 'interview' },
    { title: 'Medical English', difficulty: 'INTERMEDIATE' as const, topic: 'medical' },
    { title: 'Shopping & Consumer English', difficulty: 'BEGINNER' as const, topic: 'shopping' },
    { title: 'Academic Presentations', difficulty: 'ADVANCED' as const, topic: 'academic' },
    { title: 'Social Small Talk', difficulty: 'BEGINNER' as const, topic: 'social' },
  ];

  const createdLessons: any[] = [];
  for (const lesson of lessons) {
    const l = await prisma.lesson.create({
      data: { ...lesson, classId: engClass.id },
    });
    createdLessons.push(l);
  }
  console.log('✅ Lessons created:', createdLessons.length);

  // ============================================================
  // EXERCISES (100+)
  // ============================================================
  const exerciseData = [
    // === BEGINNER WORDS (10) ===
    { title: 'Hello Greeting', targetText: 'Hello', type: 'WORD', difficulty: 'BEGINNER', topic: 'social', lessonIdx: 9 },
    { title: 'Thank You', targetText: 'Thank you very much', type: 'WORD', difficulty: 'BEGINNER', topic: 'social', lessonIdx: 9 },
    { title: 'Good Morning', targetText: 'Good morning', type: 'WORD', difficulty: 'BEGINNER', topic: 'social', lessonIdx: 9 },
    { title: 'Please', targetText: 'Please', type: 'WORD', difficulty: 'BEGINNER', topic: 'social', lessonIdx: 9 },
    { title: 'Excuse Me', targetText: 'Excuse me', type: 'WORD', difficulty: 'BEGINNER', topic: 'social', lessonIdx: 9 },
    { title: 'Pronunciation', targetText: 'Pronunciation', type: 'WORD', difficulty: 'BEGINNER', topic: 'pronunciation', lessonIdx: 0 },
    { title: 'Comfortable', targetText: 'Comfortable', type: 'WORD', difficulty: 'BEGINNER', topic: 'pronunciation', lessonIdx: 0 },
    { title: 'Beautiful', targetText: 'Beautiful', type: 'WORD', difficulty: 'BEGINNER', topic: 'pronunciation', lessonIdx: 0 },
    { title: 'Wednesday', targetText: 'Wednesday', type: 'WORD', difficulty: 'BEGINNER', topic: 'pronunciation', lessonIdx: 0 },
    { title: 'February', targetText: 'February', type: 'WORD', difficulty: 'BEGINNER', topic: 'pronunciation', lessonIdx: 0 },

    // === BEGINNER SENTENCES (20) ===
    { title: 'Order Coffee', targetText: 'I would like to order a coffee, please.', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'restaurant', lessonIdx: 1 },
    { title: 'Request Bill', targetText: 'Could I have the bill, please?', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'restaurant', lessonIdx: 1 },
    { title: 'Table for Two', targetText: 'A table for two people, please.', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'restaurant', lessonIdx: 1 },
    { title: 'What Do You Recommend', targetText: 'What do you recommend from the menu?', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'restaurant', lessonIdx: 1 },
    { title: 'Introduce Yourself', targetText: 'My name is Alex and I am a student.', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'social', lessonIdx: 9 },
    { title: 'Where Are You From', targetText: 'Where are you from originally?', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'social', lessonIdx: 9 },
    { title: 'Nice to Meet You', targetText: 'It is nice to meet you.', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'social', lessonIdx: 9 },
    { title: 'How Are You', targetText: 'How are you doing today?', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'social', lessonIdx: 9 },
    { title: 'Shopping Inquiry', targetText: 'How much does this cost?', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'shopping', lessonIdx: 7 },
    { title: 'Try On', targetText: 'Can I try this on?', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'shopping', lessonIdx: 7 },
    { title: 'Different Size', targetText: 'Do you have this in a different size?', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'shopping', lessonIdx: 7 },
    { title: 'Opening Hours', targetText: 'What time do you open and close?', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'shopping', lessonIdx: 7 },
    { title: 'Allergic', targetText: 'I am allergic to nuts and dairy.', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'restaurant', lessonIdx: 1 },
    { title: 'Vegetarian', targetText: 'Do you have any vegetarian options?', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'restaurant', lessonIdx: 1 },
    { title: 'Take a Photo', targetText: 'Could you take a photo of us, please?', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'travel', lessonIdx: 3 },
    { title: 'Bus Stop', targetText: 'Where is the nearest bus stop?', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'travel', lessonIdx: 3 },
    { title: 'Language Barrier', targetText: 'Do you speak English?', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'travel', lessonIdx: 3 },
    { title: 'Directions', targetText: 'Can you show me on the map?', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'travel', lessonIdx: 3 },
    { title: 'Weather Chit Chat', targetText: 'The weather is lovely today, isn\'t it?', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'social', lessonIdx: 9 },
    { title: 'Weekend Plans', targetText: 'What are your plans for the weekend?', type: 'SENTENCE', difficulty: 'BEGINNER', topic: 'social', lessonIdx: 9 },

    // === INTERMEDIATE SENTENCES (20) ===
    { title: 'Business Meeting Request', targetText: 'I would like to schedule a meeting to discuss the quarterly results.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'business', lessonIdx: 2 },
    { title: 'Email Follow Up', targetText: 'I am following up on the proposal I sent you last week.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'business', lessonIdx: 2 },
    { title: 'Disagree Politely', targetText: 'I see your point, however I think we should consider an alternative approach.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'business', lessonIdx: 2 },
    { title: 'Presentation Opening', targetText: 'Good afternoon everyone, thank you for joining us today.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'business', lessonIdx: 2 },
    { title: 'Airport Check-in', targetText: 'I have a flight to New York and I would like to check in my luggage.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'travel', lessonIdx: 3 },
    { title: 'Customs Declaration', targetText: 'I have nothing to declare. I am here on a business trip for one week.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'travel', lessonIdx: 3 },
    { title: 'Hotel Check In', targetText: 'I have a reservation under the name Johnson for three nights.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'travel', lessonIdx: 3 },
    { title: 'Medical Appointment', targetText: 'I have been experiencing a headache and mild fever since yesterday morning.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'medical', lessonIdx: 6 },
    { title: 'Prescription', targetText: 'Could you explain how I should take this medication and any side effects?', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'medical', lessonIdx: 6 },
    { title: 'Emergency Medical', targetText: 'I need to see a doctor as soon as possible, it is quite urgent.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'medical', lessonIdx: 6 },
    { title: 'Negotiation', targetText: 'We are prepared to offer a competitive price provided you guarantee the delivery timeline.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'business', lessonIdx: 2 },
    { title: 'Clarify Understanding', targetText: 'Just to confirm my understanding, we will launch the product in March, correct?', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'business', lessonIdx: 2 },
    { title: 'Share Opinion', targetText: 'In my opinion, we should focus on customer retention before acquiring new users.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'business', lessonIdx: 2 },
    { title: 'Academic Discussion', targetText: 'The research suggests that climate change is accelerating at an unprecedented rate.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'academic', lessonIdx: 8 },
    { title: 'University Application', targetText: 'I am applying for the master\'s program in computer science starting next fall.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'academic', lessonIdx: 8 },
    { title: 'Library Request', targetText: 'I am looking for resources on environmental economics for my thesis.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'academic', lessonIdx: 8 },
    { title: 'Travel Problem', targetText: 'My flight has been delayed by three hours and I have missed my connecting flight.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'travel', lessonIdx: 3 },
    { title: 'Lost Luggage', targetText: 'My suitcase has not arrived at the baggage claim and I need to report it missing.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'travel', lessonIdx: 3 },
    { title: 'Restaurant Complaint', targetText: 'I am afraid there might be a mistake with our order, we did not ask for this dish.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'restaurant', lessonIdx: 1 },
    { title: 'Work From Home', targetText: 'I would prefer to work remotely on Fridays to improve my productivity and focus.', type: 'SENTENCE', difficulty: 'INTERMEDIATE', topic: 'business', lessonIdx: 2 },

    // === ADVANCED SENTENCES (20) ===
    { title: 'Board Presentation', targetText: 'Our comprehensive analysis reveals a fifteen percent increase in market share driven by our digital transformation strategy.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'business', lessonIdx: 5 },
    { title: 'Interview Strength', targetText: 'My greatest strength is my ability to adapt to rapidly changing environments while maintaining high performance standards.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'interview', lessonIdx: 5 },
    { title: 'Career Goals', targetText: 'I aspire to leverage my technical expertise to drive innovation in sustainable energy solutions over the next decade.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'interview', lessonIdx: 5 },
    { title: 'Conflict Resolution', targetText: 'Despite the disagreement, I believe we can find a mutually beneficial compromise that addresses both stakeholders\' concerns.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'business', lessonIdx: 2 },
    { title: 'Diplomatic Disagreement', targetText: 'While I appreciate the perspective you\'ve shared, the empirical evidence seems to point us in a different direction.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'academic', lessonIdx: 8 },
    { title: 'Research Hypothesis', targetText: 'Our hypothesis proposes that neuroplasticity in adults can be significantly enhanced through targeted cognitive training exercises.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'academic', lessonIdx: 8 },
    { title: 'Legal Context', targetText: 'The contract stipulates clearly that either party may terminate the agreement with thirty days written notice.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'business', lessonIdx: 2 },
    { title: 'Keynote Opening', targetText: 'Distinguished guests, colleagues, and friends, it is my profound honor to welcome you to this extraordinary occasion.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'academic', lessonIdx: 8 },
    { title: 'Philosophy Statement', targetText: 'I firmly believe that technological progress must be guided by ethical principles that prioritize human dignity and social equity.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'academic', lessonIdx: 8 },
    { title: 'Performance Review', targetText: 'Over the past quarter, I successfully led a cross-functional team of twelve to deliver the project three weeks ahead of schedule.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'interview', lessonIdx: 5 },
    { title: 'Investment Pitch', targetText: 'Our proprietary algorithm reduces operational costs by forty percent while simultaneously improving customer satisfaction scores.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'business', lessonIdx: 2 },
    { title: 'Medical Explanation', targetText: 'The symptoms you are describing could indicate either a viral infection or an inflammatory response to the medication.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'medical', lessonIdx: 6 },
    { title: 'Crisis Communication', targetText: 'We acknowledge the severity of the situation and are implementing immediate corrective measures to restore full service.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'business', lessonIdx: 2 },
    { title: 'Critical Analysis', targetText: 'The methodology employed in this study, while innovative, has several significant limitations that must be carefully considered.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'academic', lessonIdx: 8 },
    { title: 'Negotiation Closing', targetText: 'Based on our discussions, I am confident we have reached terms that reflect the value and commitment from both parties.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'business', lessonIdx: 2 },
    { title: 'Technical Explanation', targetText: 'The system utilizes machine learning algorithms to process and analyze speech patterns in real time with remarkable precision.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'academic', lessonIdx: 8 },
    { title: 'Interview Weakness', targetText: 'I have historically struggled with delegation, but I have actively developed this skill through leadership training and mentorship.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'interview', lessonIdx: 5 },
    { title: 'Futurist Statement', targetText: 'Artificial intelligence will fundamentally redefine the relationship between humans and machines within the next two decades.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'academic', lessonIdx: 8 },
    { title: 'Apology in Business', targetText: 'I sincerely apologize for the inconvenience caused and assure you that we are taking every necessary step to prevent recurrence.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'business', lessonIdx: 2 },
    { title: 'Vision Statement', targetText: 'Our vision is to create a world where every individual has equal access to high quality education regardless of their background.', type: 'SENTENCE', difficulty: 'ADVANCED', topic: 'academic', lessonIdx: 8 },

    // === PARAGRAPHS (15) ===
    { title: 'Self Introduction Speech', targetText: 'Hello, my name is Jordan and I am thrilled to be here today. I have been studying English for three years and I am particularly interested in improving my conversational skills. In my free time, I enjoy reading, hiking, and trying new cuisines from around the world.', type: 'PARAGRAPH', difficulty: 'BEGINNER', topic: 'social', lessonIdx: 9 },
    { title: 'Restaurant Review Reading', targetText: 'The restaurant was absolutely wonderful. The ambiance was warm and inviting, with soft lighting and elegant decor. The service was prompt and friendly. I highly recommend trying the grilled salmon and the chocolate lava cake for dessert. We will definitely be coming back.', type: 'PARAGRAPH', difficulty: 'BEGINNER', topic: 'restaurant', lessonIdx: 1 },
    { title: 'Travel Itinerary', targetText: 'Our trip to Paris was unforgettable. We arrived early in the morning and immediately made our way to the Eiffel Tower. In the afternoon, we explored the Louvre Museum. The evening was spent enjoying a river cruise along the Seine while watching the city lights sparkling beautifully.', type: 'PARAGRAPH', difficulty: 'INTERMEDIATE', topic: 'travel', lessonIdx: 3 },
    { title: 'Business Email Body', targetText: 'Thank you for attending yesterday\'s meeting. Following our discussion, I have attached the revised proposal incorporating your feedback. The key changes include an updated project timeline, a revised budget breakdown, and clarification on the deliverables for each phase. Please review at your earliest convenience and let me know if you have any questions.', type: 'PARAGRAPH', difficulty: 'INTERMEDIATE', topic: 'business', lessonIdx: 2 },
    { title: 'Academic Abstract', targetText: 'This study examines the relationship between bilingualism and cognitive flexibility in adults aged thirty to sixty. Using a series of standardized cognitive assessments, we investigated whether individuals fluent in two or more languages demonstrated superior problem solving abilities compared to monolingual counterparts. Our findings suggest a significant correlation between multilingualism and enhanced executive functioning.', type: 'PARAGRAPH', difficulty: 'ADVANCED', topic: 'academic', lessonIdx: 8 },
    { title: 'Interview Answer - Teamwork', targetText: 'In my previous role, I worked on a cross-functional team of eight people to launch a new product feature. We had tight deadlines and different working styles, which initially created some friction. I suggested we hold a brief daily standup to align on priorities and blockers. This improved communication significantly and we delivered the project on time with excellent results.', type: 'PARAGRAPH', difficulty: 'ADVANCED', topic: 'interview', lessonIdx: 5 },
    { title: 'Product Pitch', targetText: 'Imagine being able to learn a new language in half the time using artificial intelligence. That is exactly what we have built. Our platform analyzes your speech in real time, identifies specific areas for improvement, and generates personalized exercises to help you progress faster. Over ten thousand learners have improved their pronunciation score by over thirty percent in just ninety days.', type: 'PARAGRAPH', difficulty: 'ADVANCED', topic: 'business', lessonIdx: 2 },
    { title: 'Weather News Reading', targetText: 'Good evening, here is your weather forecast for the week. We are expecting sunny skies through Wednesday with temperatures reaching a pleasant twenty four degrees. However, a cold front is moving in from the northwest and there is a strong chance of heavy rain by Thursday. Make sure to keep an umbrella handy for the end of the week.', type: 'PARAGRAPH', difficulty: 'INTERMEDIATE', topic: 'social', lessonIdx: 9 },
    { title: 'Medical Consultation', targetText: 'I have been experiencing persistent lower back pain for the past two weeks. The pain is most severe in the morning when I first wake up, and it tends to improve as the day goes on. I have tried over the counter pain medication but it only provides temporary relief. I have not had any recent injuries that I am aware of.', type: 'PARAGRAPH', difficulty: 'INTERMEDIATE', topic: 'medical', lessonIdx: 6 },
    { title: 'Customer Complaint', targetText: 'I am writing to express my dissatisfaction with the service I received at your store last Saturday. Despite the extended wait time of over thirty minutes, the staff seemed disorganized and failed to address my inquiry properly. I believe this experience does not reflect the high standards your company typically maintains and I hope this matter will be looked into seriously.', type: 'PARAGRAPH', difficulty: 'ADVANCED', topic: 'business', lessonIdx: 2 },
    { title: 'Storytelling - Past Adventure', targetText: 'Last summer I had an incredible adventure in Southeast Asia. I traveled through four countries in three weeks, meeting fascinating people along the way. The highlight of my journey was spending three days with a local family in rural Vietnam who taught me traditional cooking. It completely changed my perspective on what matters most in life.', type: 'PARAGRAPH', difficulty: 'INTERMEDIATE', topic: 'social', lessonIdx: 9 },
    { title: 'Shopping Experience', targetText: 'I visited the new shopping center downtown and was thoroughly impressed. The layout is well designed and easy to navigate. There is a wonderful variety of stores ranging from high end fashion boutiques to everyday essentials. The food court on the top floor offers cuisine from six different countries. I spent most of the afternoon there and plan to return soon.', type: 'PARAGRAPH', difficulty: 'BEGINNER', topic: 'shopping', lessonIdx: 7 },
    { title: 'Technology Trend Analysis', targetText: 'Artificial intelligence is transforming every sector of the global economy at an unprecedented pace. From healthcare diagnostics to financial modeling, machine learning algorithms are delivering results that were once thought impossible. As these technologies continue to mature, businesses that fail to adapt risk becoming obsolete. However, concerns around data privacy and algorithmic bias must be proactively addressed.', type: 'PARAGRAPH', difficulty: 'ADVANCED', topic: 'academic', lessonIdx: 8 },
    { title: 'Debate Opening Statement', targetText: 'Distinguished judges, fellow students, and guests, we stand firmly on the affirmative side of today\'s motion: that artificial intelligence will create more jobs than it eliminates. The evidence clearly shows that while automation displaces certain roles, it consistently generates new categories of work requiring uniquely human skills such as creativity, empathy, and complex reasoning.', type: 'PARAGRAPH', difficulty: 'ADVANCED', topic: 'academic', lessonIdx: 8 },
    { title: 'Daily Routine Description', targetText: 'I usually wake up at six thirty in the morning. After a quick workout, I prepare a healthy breakfast and spend fifteen minutes reviewing my goals for the day. I start work at eight and try to tackle the most challenging tasks in the morning when my focus is sharpest. Evenings are reserved for language practice, reading, and spending time with family.', type: 'PARAGRAPH', difficulty: 'BEGINNER', topic: 'social', lessonIdx: 9 },

    // === ROLEPLAY / CONVERSATION (15) ===
    { title: 'Order at Café', targetText: 'I\'d like a medium latte with oat milk, please. Oh, and can I also get a blueberry muffin? For here, thank you.', type: 'ROLEPLAY', difficulty: 'BEGINNER', topic: 'restaurant', lessonIdx: 1 },
    { title: 'Job Interview Opening', targetText: 'Thank you for having me today. I am really excited about this opportunity. I have three years of experience in software development and I believe my skills align perfectly with what you\'re looking for.', type: 'ROLEPLAY', difficulty: 'ADVANCED', topic: 'interview', lessonIdx: 5 },
    { title: 'Airport Security', targetText: 'Yes, of course. Here is my passport and boarding pass. The laptop is in the tray already. Do I need to remove my shoes as well?', type: 'ROLEPLAY', difficulty: 'INTERMEDIATE', topic: 'travel', lessonIdx: 3 },
    { title: 'Hotel Request', targetText: 'Excuse me, could I request an extra blanket and some pillows for my room? Also, is there a wake-up call service available for six AM?', type: 'ROLEPLAY', difficulty: 'INTERMEDIATE', topic: 'travel', lessonIdx: 3 },
    { title: 'Doctor Patient', targetText: 'I have had this sore throat for about four days now and I am also running a slight fever. I haven\'t been sleeping well either. I wanted to get it checked before it gets any worse.', type: 'ROLEPLAY', difficulty: 'INTERMEDIATE', topic: 'medical', lessonIdx: 6 },
    { title: 'Store Return', targetText: 'Hi, I bought this jacket here last week but I would like to return it. I have the receipt. The reason is that the zipper is not working properly.', type: 'ROLEPLAY', difficulty: 'BEGINNER', topic: 'shopping', lessonIdx: 7 },
    { title: 'Business Negotiation', targetText: 'We are very interested in your offer. However, given the volume of our order, we would expect a discount of at least fifteen percent. This is something we need to agree on before moving forward.', type: 'ROLEPLAY', difficulty: 'ADVANCED', topic: 'business', lessonIdx: 2 },
    { title: 'Asking for Directions', targetText: 'Excuse me, I am completely lost. I am trying to get to the National Museum. Could you point me in the right direction? Is it walking distance from here?', type: 'ROLEPLAY', difficulty: 'BEGINNER', topic: 'travel', lessonIdx: 3 },
    { title: 'Phone Call - Appointment', targetText: 'Hello, I\'d like to make an appointment with Doctor Chen for this Thursday if possible, preferably in the afternoon. My name is Alex Rivera. My phone number is zero seven seven double three four five.', type: 'ROLEPLAY', difficulty: 'INTERMEDIATE', topic: 'medical', lessonIdx: 6 },
    { title: 'Rent a Car', targetText: 'I have a reservation for an economy car for five days. I would also like to add GPS navigation to the package. Do you accept international driving licenses here?', type: 'ROLEPLAY', difficulty: 'INTERMEDIATE', topic: 'travel', lessonIdx: 3 },
    { title: 'Salary Negotiation', targetText: 'I am very enthusiastic about joining the team. Based on my experience and the market rate for this position, I was expecting something closer to sixty thousand annually. Is there any flexibility there?', type: 'ROLEPLAY', difficulty: 'ADVANCED', topic: 'interview', lessonIdx: 5 },
    { title: 'Compliment and Small Talk', targetText: 'I love your presentation style! You always manage to explain complex topics so clearly. How long have you been in this field? I am still learning the ropes and would love some advice.', type: 'ROLEPLAY', difficulty: 'INTERMEDIATE', topic: 'social', lessonIdx: 9 },
    { title: 'Group Study Plan', targetText: 'So I was thinking we could meet at the library on Tuesday around four PM. We can split the chapters between us and then teach each other the key points. Does that work for everyone?', type: 'ROLEPLAY', difficulty: 'INTERMEDIATE', topic: 'academic', lessonIdx: 8 },
    { title: 'Coffee Chat - Networking', targetText: 'It\'s great to finally connect! I have been following your work for a while. I am exploring opportunities in UX design and thought it would be wonderful to get your perspective on the field.', type: 'ROLEPLAY', difficulty: 'ADVANCED', topic: 'social', lessonIdx: 9 },
    { title: 'Restaurant Feedback', targetText: 'Everything was absolutely delicious, thank you. The pasta was cooked perfectly and the service was exceptional. We would love to come back. Could I speak with the manager to pass on our compliments?', type: 'ROLEPLAY', difficulty: 'INTERMEDIATE', topic: 'restaurant', lessonIdx: 1 },
  ];

  let exercisesCreated = 0;
  for (const ex of exerciseData) {
    await prisma.exercise.create({
      data: {
        title: ex.title,
        targetText: ex.targetText,
        type: ex.type as any,
        difficulty: ex.difficulty as any,
        topic: ex.topic,
        lessonId: createdLessons[ex.lessonIdx].id,
        instructions: `Listen carefully and repeat the ${ex.type.toLowerCase()} with natural pronunciation and correct intonation.`,
      },
    });
    exercisesCreated++;
  }
  console.log(`✅ Exercises created: ${exercisesCreated}`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👩‍🏫 Teacher:  teacher@elsa.com  / teacher123');
  console.log('🎓 Student:  alex@elsa.com     / student123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
