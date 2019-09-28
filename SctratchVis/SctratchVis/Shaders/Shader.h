#ifndef SHADER_H
#define SHADER_H

#include <include/glad/glad.h>

#include <string>
#include <fstream>
#include <sstream>
#include <iostream>
#include <include/glm/glm/glm.hpp>

class Shader
{
private:
	// functions
	void checkCompileErrors(unsigned int shader, std::string type);

	// variabls
	unsigned int mVertID, mFragID, mGeomID;
	unsigned int mID;

	std::string mVertPath;
	std::string mFragPath;
	std::string mGeomPath;
	std::string mShaderName;

public:
	// constructor/destructor
	Shader(const char* name, unsigned int vID, unsigned int fID, unsigned int gID, const char* vertexPath, const char* fragmentPath, const char* geometryPath = NULL);
	~Shader();

	// functions
	void setBool(const std::string &name, bool value) const;
	void setInt(const std::string &name, int value) const;
	void setFloat(const std::string &name, float value) const;
	void setFloatArray(const std::string &name, float* arr, int size) const;
	void setVec2(const std::string &name, const glm::vec2 &value) const;
	void setVec2(const std::string &name, float x, float y) const;
	void setVec3(const std::string &name, const glm::vec3 &value) const;
	void setVec3(const std::string &name, float x, float y, float z) const;
	void setVec4(const std::string &name, const glm::vec4 &value) const;
	void setVec4(const std::string &name, float x, float y, float z, float w) const;
	void setMat2(const std::string &name, const glm::mat2 &mat) const;
	void setMat3(const std::string &name, const glm::mat3 &mat) const;
	void setMat4(const std::string &name, const glm::mat4 &mat) const;
	void use();

	// getters/setters
	GLuint getID() { return mID; };

	void setVertPath(std::string s) { mVertPath = s; };
	std::string getVertPath() { return mVertPath; };

	void setFragPath(std::string s) { mFragPath = s; };
	std::string getFragPath() { return mFragPath; };

	void setGeomPath(std::string s) { mGeomPath = s; };
	std::string getGeomPath() { return mGeomPath; };

	unsigned int getVertID() { return mVertID; };
	unsigned int getFragID() { return mFragID; };
	unsigned int getGeomID() { return mGeomID; };

	std::string getProgramName() { return mShaderName; };
};

#endif
