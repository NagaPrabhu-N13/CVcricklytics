import React, { useState, useEffect } from 'react';
import { 
  FaBook,
  FaVideo,
  FaCertificate,
  FaSearch,
  FaArrowRight,
  FaStar,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import backButton from '../../assets/kumar/right-chevron.png';
import { db, auth, storage } from "../../firebase"; // Adjust path as needed, include storage
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const AcademicsPage = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    level: 'Beginner',
    duration: '',
    rating: '',
    students: '',
    image: '',
    description: '',
    syllabus: [],
    imageSource: 'url',
    imageFile: null
  });
  const [detailsFormData, setDetailsFormData] = useState({
    description: '',
    syllabus: []
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all course data from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'Courses'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(data);
    }, (error) => {
      console.error("Error fetching courses:", error);
    });

    return () => unsubscribe();
  }, []);

  // Calculate stats for "Cricket Academics By The Numbers"
  const calculateStats = () => {
    const totalCourses = courses.length;
    const uniqueInstructors = [...new Set(courses.map(course => course.instructor))].length;
    const totalStudents = courses.reduce((sum, course) => sum + (parseInt(course.students) || 0), 0);
    const averageRating = courses.length > 0
      ? (courses.reduce((sum, course) => sum + (parseFloat(course.rating) || 0), 0) / courses.length).toFixed(1)
      : 0;

    return {
      totalCourses,
      uniqueInstructors,
      totalStudents,
      averageRating
    };
  };

  const { totalCourses, uniqueInstructors, totalStudents, averageRating } = calculateStats();

  // Handle saving or updating course data
  const handleSaveData = async () => {
    if (!formData.title.trim() || !formData.instructor.trim() || !formData.level || !formData.duration.trim() || !formData.rating || !formData.students || !formData.description.trim()) {
      alert("Please fill all required fields!");
      return;
    }
    if (isNaN(formData.rating) || formData.rating < 0 || formData.rating > 5) {
      alert("Rating must be between 0 and 5!");
      return;
    }
    if (isNaN(formData.students) || formData.students < 0) {
      alert("Students must be a non-negative number!");
      return;
    }
    if (formData.imageSource === 'url' && formData.image && !formData.image.match(/\.(jpg|jpeg|png|gif)$/i)) {
      alert("Please provide a valid image URL (jpg, jpeg, png, gif)!");
      return;
    }
    if (formData.imageSource === 'file' && !formData.imageFile) {
      alert("Please select an image file!");
      return;
    }
    if (formData.imageSource === 'file' && formData.imageFile && !formData.imageFile.type.match(/image\/(jpg|jpeg|png|gif)/i)) {
      alert("Please select a valid image file (jpg, jpeg, png, gif)!");
      return;
    }
    if (formData.syllabus.length === 0) {
      alert("Please add at least one syllabus item!");
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = formData.image;
      if (formData.imageSource === 'file' && formData.imageFile) {
        const storageRef = ref(storage, `courses/${auth.currentUser.uid}/${formData.imageFile.name}`);
        await uploadBytes(storageRef, formData.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const entryData = {
        title: formData.title,
        instructor: formData.instructor,
        level: formData.level,
        duration: formData.duration,
        rating: parseFloat(formData.rating),
        students: parseInt(formData.students),
        image: imageUrl || '',
        description: formData.description,
        syllabus: formData.syllabus,
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'Courses', editingId), entryData);
      } else {
        await addDoc(collection(db, 'Courses'), entryData);
      }

      setFormData({
        title: '',
        instructor: '',
        level: 'Beginner',
        duration: '',
        rating: '',
        students: '',
        image: '',
        description: '',
        syllabus: [],
        imageSource: 'url',
        imageFile: null
      });
      setEditingId(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving data:", err);
      alert("Failed to save data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving or updating course details (description and syllabus)
  const handleSaveDetails = async () => {
    if (!detailsFormData.description.trim()) {
      alert("Please provide a course description!");
      return;
    }
    if (detailsFormData.syllabus.length === 0) {
      alert("Please add at least one syllabus item!");
      return;
    }

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'Courses', selectedCourse.id), {
        description: detailsFormData.description,
        syllabus: detailsFormData.syllabus
      });
      setSelectedCourse({
        ...selectedCourse,
        description: detailsFormData.description,
        syllabus: detailsFormData.syllabus
      });
      setDetailsFormData({ description: '', syllabus: [] });
      setIsDetailsModalOpen(false);
    } catch (err) {
      console.error("Error saving details:", err);
      alert("Failed to save details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting course data
  const handleDeleteData = async (id) => {
    const course = courses.find(c => c.id === id);
    if (!course || course.userId !== auth.currentUser.uid) {
      alert("You can only delete your own courses.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      await deleteDoc(doc(db, 'Courses', id));
      if (selectedCourse && selectedCourse.id === id) {
        setSelectedCourse(null);
      }
    } catch (err) {
      console.error("Error deleting data:", err);
      alert("Failed to delete data. Please try again.");
    }
  };

  // Handle editing course data
  const handleEditData = (course) => {
    if (course.userId !== auth.currentUser.uid) {
      alert("You can only edit your own courses.");
      return;
    }

    setFormData({
      title: course.title,
      instructor: course.instructor,
      level: course.level,
      duration: course.duration,
      rating: course.rating.toString(),
      students: course.students.toString(),
      image: course.image,
      description: course.description,
      syllabus: course.syllabus,
      imageSource: course.image ? 'url' : 'none',
      imageFile: null
    });
    setEditingId(course.id);
    setIsModalOpen(true);
  };

  // Handle editing course details
  const handleEditDetails = (course) => {
    if (course.userId !== auth.currentUser.uid) {
      alert("You can only edit your own courses.");
      return;
    }

    setDetailsFormData({
      description: course.description,
      syllabus: course.syllabus
    });
    setIsDetailsModalOpen(true);
  };

  // Add syllabus item
  const addSyllabusItem = () => {
    const newItem = prompt("Enter syllabus item:");
    if (newItem && newItem.trim()) {
      setFormData({ ...formData, syllabus: [...formData.syllabus, newItem.trim()] });
    }
  };

  // Add syllabus item for details modal
  const addDetailsSyllabusItem = () => {
    const newItem = prompt("Enter syllabus item:");
    if (newItem && newItem.trim()) {
      setDetailsFormData({ ...detailsFormData, syllabus: [...detailsFormData.syllabus, newItem.trim()] });
    }
  };

  // Remove syllabus item
  const removeSyllabusItem = (index) => {
    setFormData({ ...formData, syllabus: formData.syllabus.filter((_, i) => i !== index) });
  };

  // Remove syllabus item for details modal
  const removeDetailsSyllabusItem = (index) => {
    setDetailsFormData({ ...detailsFormData, syllabus: detailsFormData.syllabus.filter((_, i) => i !== index) });
  };

  // Filter courses based on search term
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      i < Math.floor(rating) ?
        <FaStar key={i} className="text-yellow-400 inline" /> :
        <FaStar key={i} className="text-gray-300 inline" />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0f28] to-[#06122e] text-white">
      {/* Header */}
      <header className="py-6 px-4 shadow-md">
        <div className="container mx-auto">
          <img
            src={backButton}
            alt="Back"
            className="h-8 w-8 cursor-pointer -scale-x-100"
            onClick={() => window.history.back()}
          />
          <div className="text-center mt-4">
            <h1 className="text-5xl md:text-5xl font-bold">
              Cricket Academics
            </h1>
            <p className="text-blue-200 mt-2">Elevate your cricket knowledge with expert-led courses</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full pl-10 pr-4 py-2 bg-[#0b1a3b] border border-blue-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setFormData({
                title: '',
                instructor: '',
                level: 'Beginner',
                duration: '',
                rating: '',
                students: '',
                image: '',
                description: '',
                syllabus: [],
                imageSource: 'url',
                imageFile: null
              });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Course
          </button>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <div
                key={course.id}
                className="bg-[#0b1a3b] border border-blue-600/30 rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer relative"
                onClick={() => setSelectedCourse(course)}
              >
                <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                  {course.userId === auth.currentUser.uid && (
                    <>
                      <FaEdit
                        className="text-yellow-500 cursor-pointer hover:text-yellow-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditData(course);
                        }}
                      />
                      <FaTrash
                        className="text-red-500 cursor-pointer hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteData(course.id);
                        }}
                      />
                    </>
                  )}
                </div>
                <div className="relative h-48">
                  <img
                    src={course.image || 'https://via.placeholder.com/150'}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <h3 className="text-xl font-bold">{course.title}</h3>
                    <p className="text-blue-300">{course.instructor}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded text-xs">
                      {course.level}
                    </span>
                    <div className="flex items-center">
                      {renderStars(course.rating)}
                      <span className="ml-1 text-sm">{course.rating}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400 mb-3">
                    <span>{course.duration}</span>
                    <span>{course.students.toLocaleString()} students</span>
                  </div>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center">
                    View Details <FaArrowRight className="ml-2" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400">No courses found. Add a course to get started!</p>
        )}

        {/* Course Modal */}
        {selectedCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-[#0b1a3b] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-blue-500/30">
              <div className="relative">
                <img
                  src={selectedCourse.image || 'https://via.placeholder.com/150'}
                  alt={selectedCourse.title}
                  className="w-full h-64 object-cover"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                />
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 text-gray-800"
                >
                  ✕
                </button>
                {selectedCourse.userId === auth.currentUser.uid && (
                  <button
                    onClick={() => handleEditDetails(selectedCourse)}
                    className="absolute top-4 right-12 bg-yellow-500 rounded-full p-2 shadow-md hover:bg-yellow-600 text-white"
                  >
                    <FaEdit />
                  </button>
                )}
              </div>
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedCourse.title}</h2>
                    <p className="text-blue-400">By {selectedCourse.instructor}</p>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center">
                    {renderStars(selectedCourse.rating)}
                    <span className="ml-2">{selectedCourse.rating} ({selectedCourse.students.toLocaleString()} students)</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">About This Course</h3>
                  <p className="text-gray-300">{selectedCourse.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-[#1a2342] p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <FaBook className="text-blue-400 mr-2" />
                      <h4 className="font-semibold">Course Level</h4>
                    </div>
                    <p className="text-gray-300">{selectedCourse.level}</p>
                  </div>
                  <div className="bg-[#1a2342] p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <FaVideo className="text-blue-400 mr-2" />
                      <h4 className="font-semibold">Duration</h4>
                    </div>
                    <p className="text-gray-300">{selectedCourse.duration}</p>
                  </div>
                  <div className="bg-[#1a2342] p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <FaCertificate className="text-blue-400 mr-2" />
                      <h4 className="font-semibold">Certificate</h4>
                    </div>
                    <p className="text-gray-300">Included</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4">What You'll Learn</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedCourse.syllabus.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-400 mr-2">✓</span>
                        <span className="text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center">
                    Enroll Now
                  </button>
                  <button className="flex-1 border border-blue-500 text-blue-400 hover:bg-blue-900/50 py-3 rounded-lg font-bold">
                    Add to Wishlist
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Course Input Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
            <div
              className="w-96 rounded-lg p-6 shadow-lg max-h-[80vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(140deg, rgba(8,0,6,0.85) 15%, rgba(255,0,119,0.85))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-white text-center font-semibold">
                {editingId ? 'Edit Course' : 'Add Course'}
              </h2>
              <label className="block mb-1 text-white font-semibold" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="Enter course title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="instructor">
                Instructor
              </label>
              <input
                id="instructor"
                type="text"
                placeholder="Enter instructor name"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="level">
                Level
              </label>
              <select
  id="level"
  value={formData.level}
  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
  className="w-full mb-3 p-2 rounded border border-white-600 bg-transparent text-white focus:outline-none focus:ring-white"
  disabled={isLoading}
>
  <option className="bg-white text-gray-700" value="Beginner">Beginner</option>
  <option className="bg-white text-gray-700" value="Intermediate">Intermediate</option>
  <option className="bg-white text-gray-700" value="Advanced">Advanced</option>
  <option className="bg-white text-gray-700" value="All Levels">All Levels</option>
</select>

              <label className="block mb-1 text-white font-semibold" htmlFor="duration">
                Duration
              </label>
              <input
                id="duration"
                type="text"
                placeholder="Enter duration (e.g., 6 weeks)"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="rating">
                Rating (0-5)
              </label>
              <input
                id="rating"
                type="number"
                placeholder="Enter rating"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                min="0"
                max="5"
                step="0.1"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold" htmlFor="students">
                Students
              </label>
              <input
                id="students"
                type="number"
                placeholder="Enter number of students"
                value={formData.students}
                onChange={(e) => setFormData({ ...formData, students: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                min="0"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold">Image Source</label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center text-white">
                  <input
                    type="radio"
                    name="imageSource"
                    value="url"
                    checked={formData.imageSource === 'url'}
                    onChange={(e) => setFormData({ ...formData, imageSource: e.target.value, image: '', imageFile: null })}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  URL
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="radio"
                    name="imageSource"
                    value="file"
                    checked={formData.imageSource === 'file'}
                    onChange={(e) => setFormData({ ...formData, imageSource: e.target.value, image: '', imageFile: null })}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  Local File
                </label>
              </div>
              {formData.imageSource === 'url' ? (
                <>
                  <label className="block mb-1 text-white font-semibold" htmlFor="image">
                    Image URL (Optional)
                  </label>
                  <input
                    id="image"
                    type="text"
                    placeholder="Enter image URL"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    disabled={isLoading}
                  />
                </>
              ) : (
                <>
                  <label className="block mb-1 text-white font-semibold" htmlFor="imageFile">
                    Image File (Optional)
                  </label>
                  <input
                    id="imageFile"
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={(e) => setFormData({ ...formData, imageFile: e.target.files[0] })}
                    className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    disabled={isLoading}
                  />
                </>
              )}
              <label className="block mb-1 text-white font-semibold" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                placeholder="Enter course description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows="4"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold">Syllabus</label>
              <div className="mb-3">
                {formData.syllabus.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 mb-1">
                    <span className="text-gray-300">{item}</span>
                    <button
                      onClick={() => removeSyllabusItem(index)}
                      className="text-red-500 hover:text-red-600"
                      disabled={isLoading}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={addSyllabusItem}
                  className="text-blue-400 hover:text-blue-500 text-sm"
                  disabled={isLoading}
                >
                  + Add Syllabus Item
                </button>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setFormData({
                      title: '',
                      instructor: '',
                      level: 'Beginner',
                      duration: '',
                      rating: '',
                      students: '',
                      image: '',
                      description: '',
                      syllabus: [],
                      imageSource: 'url',
                      imageFile: null
                    });
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveData}
                  className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded transition"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Course Details Edit Modal */}
        {isDetailsModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
            <div
              className="w-96 rounded-lg p-6 shadow-lg max-h-[80vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(140deg, rgba(8,0,6,0.85) 15%, rgba(255,0,119,0.85))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-white text-center font-semibold">
                Edit Course Details
              </h2>
              <label className="block mb-1 text-white font-semibold" htmlFor="detailsDescription">
                Description
              </label>
              <textarea
                id="detailsDescription"
                placeholder="Enter course description"
                value={detailsFormData.description}
                onChange={(e) => setDetailsFormData({ ...detailsFormData, description: e.target.value })}
                className="w-full mb-3 p-2 rounded border border-gray-600 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows="4"
                disabled={isLoading}
              />
              <label className="block mb-1 text-white font-semibold">Syllabus</label>
              <div className="mb-3">
                {detailsFormData.syllabus.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 mb-1">
                    <span className="text-gray-300">{item}</span>
                    <button
                      onClick={() => removeDetailsSyllabusItem(index)}
                      className="text-red-500 hover:text-red-600"
                      disabled={isLoading}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={addDetailsSyllabusItem}
                  className="text-blue-400 hover:text-blue-500 text-sm"
                  disabled={isLoading}
                >
                  + Add Syllabus Item
                </button>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setDetailsFormData({ description: '', syllabus: [] });
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDetails}
                  className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded transition"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Section */}
        {!selectedCourse && (
          <div className="mt-12 bg-[#0b1a3b]/50 border border-blue-600/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">Cricket Academics By The Numbers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{totalCourses}</p>
                <p className="text-gray-400">Courses Available</p>
              </div>
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{uniqueInstructors}</p>
                <p className="text-gray-400">World-Class Instructors</p>
              </div>
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{totalStudents.toLocaleString()}</p>
                <p className="text-gray-400">Students Enrolled</p>
              </div>
              <div className="bg-[#0b1a3b] border border-blue-600/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{averageRating}</p>
                <p className="text-gray-400">Average Rating</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicsPage;
