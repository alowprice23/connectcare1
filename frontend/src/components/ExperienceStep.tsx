import React, { useState } from "react";
import { HelpTooltip } from "components/HelpTooltip";
import { Button } from "components/Button";
import { PlusCircle, XCircle } from "lucide-react";

interface ExperienceStepProps {
  formData: {
    yearsExperience: string;
    certifications: string[];
    education: string;
    skills: string[];
  };
  updateFormData: (data: Partial<ExperienceStepProps["formData"]>) => void;
}

export function ExperienceStep({ formData, updateFormData }: ExperienceStepProps) {
  const [newCertification, setNewCertification] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const addCertification = () => {
    if (newCertification.trim() !== "") {
      updateFormData({
        certifications: [...formData.certifications, newCertification.trim()]
      });
      setNewCertification("");
    }
  };

  const removeCertification = (index: number) => {
    const updatedCertifications = [...formData.certifications];
    updatedCertifications.splice(index, 1);
    updateFormData({ certifications: updatedCertifications });
  };

  const addSkill = () => {
    if (newSkill.trim() !== "") {
      updateFormData({
        skills: [...formData.skills, newSkill.trim()]
      });
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    const updatedSkills = [...formData.skills];
    updatedSkills.splice(index, 1);
    updateFormData({ skills: updatedSkills });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        Experience & Qualifications
        <HelpTooltip text="Please provide information about your caregiving experience, qualifications, and skills." />
      </h2>

      <div className="space-y-6">
        <div>
          <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            Years of Caregiving Experience
            <HelpTooltip text="How many years have you worked as a caregiver? Include both professional and personal experience." />
          </label>
          <select
            id="yearsExperience"
            name="yearsExperience"
            value={formData.yearsExperience}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select years of experience</option>
            <option value="Less than 1 year">Less than 1 year</option>
            <option value="1-2 years">1-2 years</option>
            <option value="3-5 years">3-5 years</option>
            <option value="6-10 years">6-10 years</option>
            <option value="More than 10 years">More than 10 years</option>
          </select>
        </div>

        <div>
          <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            Education
            <HelpTooltip text="What is your highest level of education? Include any healthcare-related degrees or diplomas." />
          </label>
          <select
            id="education"
            name="education"
            value={formData.education}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select highest education</option>
            <option value="High School Diploma/GED">High School Diploma/GED</option>
            <option value="Some College">Some College</option>
            <option value="Associate's Degree">Associate's Degree</option>
            <option value="Bachelor's Degree">Bachelor's Degree</option>
            <option value="Master's Degree">Master's Degree</option>
            <option value="Doctoral Degree">Doctoral Degree</option>
            <option value="Vocational Training">Vocational Training</option>
            <option value="CNA Certification">CNA Certification</option>
            <option value="LPN/LVN License">LPN/LVN License</option>
            <option value="RN License">RN License</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            Certifications & Licenses
            <HelpTooltip text="List any relevant certifications or licenses such as CNA, CPR, First Aid, etc." />
          </label>
          
          <div className="flex items-center mb-2">
            <input
              type="text"
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              placeholder="E.g., CPR, First Aid, CNA"
              className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button 
              onClick={addCertification}
              disabled={newCertification.trim() === ""}
              className="flex items-center justify-center h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          
          {formData.certifications.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {formData.certifications.map((cert, index) => (
                <li key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                  <span>{cert}</span>
                  <button
                    type="button"
                    onClick={() => removeCertification(index)}
                    className="text-red-500 hover:text-red-700 focus:outline-none"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mt-2">No certifications added yet.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            Caregiving Skills
            <HelpTooltip text="List specific caregiving skills you possess, such as medication management, mobility assistance, meal preparation, etc." />
          </label>
          
          <div className="flex items-center mb-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="E.g., Medication Management, Meal Preparation"
              className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button 
              onClick={addSkill}
              disabled={newSkill.trim() === ""}
              className="flex items-center justify-center h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          
          {formData.skills.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {formData.skills.map((skill, index) => (
                <li key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="text-red-500 hover:text-red-700 focus:outline-none"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mt-2">No skills added yet.</p>
          )}
        </div>
      </div>

      <div className="mt-6 px-4 py-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-700">
          <span className="font-semibold">Tip:</span> Including relevant certifications and specific skills helps us match you with clients who require your expertise.
        </p>
      </div>
    </div>
  );
}
