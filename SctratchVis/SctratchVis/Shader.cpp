#include "Shaders/Shader.h"

Shader::Shader(const char* name, unsigned int vID, unsigned int fID, unsigned int gID, const char* vertexPath, const char* fragmentPath, const char* geometryPath)
{
	mShaderName = name;

	this->setVertPath(vertexPath);
	this->setFragPath(fragmentPath);

	// 1) retrieve source code from filePath
	std::string vertCode,
		fragCode;

	std::ifstream vShaderFile,
		fShaderFile;

	// ensure ifstream objects can throw exceptions
	vShaderFile.exceptions(std::ifstream::failbit | std::ifstream::badbit);
	fShaderFile.exceptions(std::ifstream::failbit | std::ifstream::badbit);

	try
	{
		// open files
		vShaderFile.open(vertexPath);
		fShaderFile.open(fragmentPath);
		std::stringstream vShaderStream,
			fShaderStream;

		// read files buffer contents into streams
		vShaderStream << vShaderFile.rdbuf();
		fShaderStream << fShaderFile.rdbuf();

		// close file handlers
		vShaderFile.close();
		fShaderFile.close();

		// convert stream into string
		vertCode = vShaderStream.str();
		fragCode = fShaderStream.str();
	}
	catch (std::ifstream::failure e)
	{
		std::cout << "ERROR::SHADER::FILE_NOT_SUCCESFULLY_READ" << std::endl;
	}

	const char *vShaderCode = vertCode.c_str(),
		*fShaderCode = fragCode.c_str();

	// 2) compile shaders

	if (vID == 0)
		mVertID = glCreateShader(GL_VERTEX_SHADER);
	else
		mVertID = vID;
	glShaderSource(mVertID, 1, &vShaderCode, NULL);
	glCompileShader(mVertID);
	checkCompileErrors(mVertID, "VERTEX");

	// fragment shader
	if (fID == 0)
		mFragID = glCreateShader(GL_FRAGMENT_SHADER);
	else
		mFragID = fID;
	glShaderSource(mFragID, 1, &fShaderCode, NULL);
	glCompileShader(mFragID);
	checkCompileErrors(mFragID, "FRAGMENT");

	// shader program
	mID = glCreateProgram();
	glAttachShader(mID, mVertID);
	glAttachShader(mID, mFragID);

	glLinkProgram(mID);
	checkCompileErrors(mID, "PROGRAM");
	if (geometryPath)
	{
		std::cout << geometryPath << std::endl;
		this->setGeomPath(geometryPath);
		std::cout << "Something's wrong" << std::endl;
		std::string geomCode;
		std::ifstream gShaderFile;
		gShaderFile.exceptions(std::ifstream::failbit | std::ifstream::badbit);
		try
		{
			gShaderFile.open(geometryPath);
			std::stringstream gShaderStream;
			gShaderFile.close();
			geomCode = gShaderStream.str();
			gShaderStream << gShaderFile.rdbuf();
		}
		catch (std::ifstream::failure e)
		{
			std::cout << "ERROR::SHADER::FILE_NOT_SUCCESFULLY_READ" << std::endl;
		}
		const char *gShaderCode = geomCode.c_str();

		// geometry shader
		if (gID == 0)
			mGeomID = glCreateShader(GL_GEOMETRY_SHADER);
		else
			mGeomID = gID;
		glShaderSource(mGeomID, 1, &gShaderCode, NULL);
		glCompileShader(mGeomID);
		checkCompileErrors(mGeomID, "GEOMETRY");

		glAttachShader(mID, mGeomID);
		glLinkProgram(mID);
		checkCompileErrors(mID, "PROGRAM");
		glDeleteShader(mGeomID);
	}

	// delete the shaders that are now linked into program
	glDeleteShader(mVertID);
	glDeleteShader(mFragID);
}

void Shader::checkCompileErrors(unsigned int shader, std::string type)
{
	int success;
	char infoLog[1024];
	if (type != "PROGRAM")
	{
		glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
		if (!success)
		{
			glGetShaderInfoLog(shader, 1024, NULL, infoLog);
			std::cout << "Shader Program: " << mShaderName << std::endl << "ERROR::SHADER_COMPILATION_ERROR of type: " << type << "\n" << infoLog << "\n -- --------------------------------------------------- -- " << std::endl;
		}
	}
	else
	{
		glGetProgramiv(shader, GL_LINK_STATUS, &success);
		if (!success)
		{
			glGetProgramInfoLog(shader, 1024, NULL, infoLog);
			std::cout << "Shader Program: " << mShaderName << std::endl << "ERROR::PROGRAM_LINKING_ERROR of type: " << type << "\n" << infoLog << "\n -- --------------------------------------------------- -- " << std::endl;
		}
	}
}

// utility uniform functions
void Shader::setBool(const std::string &name, bool value) const
{
	glUniform1i(glGetUniformLocation(mID, name.c_str()), (int)value);
}

void Shader::setInt(const std::string &name, int value) const
{
	glUniform1i(glGetUniformLocation(mID, name.c_str()), value);
}

void Shader::setFloat(const std::string &name, float value) const
{
	glUniform1f(glGetUniformLocation(mID, name.c_str()), value);
}

void Shader::setFloatArray(const std::string &name, float* arr, int size) const
{
	//glUniform1fv(mID, size, arr);
	glUniform1fv(glGetUniformLocation(mID, "uSpectrum"), size, arr);
}

void Shader::setVec2(const std::string &name, const glm::vec2 &value) const
{
	glUniform2fv(glGetUniformLocation(mID, name.c_str()), 1, &value[0]);
}

void Shader::setVec2(const std::string &name, float x, float y) const
{
	glUniform2f(glGetUniformLocation(mID, name.c_str()), x, y);
}

void Shader::setVec3(const std::string &name, const glm::vec3 &value) const
{
	glUniform3fv(glGetUniformLocation(mID, name.c_str()), 1, &value[0]);
}

void Shader::setVec3(const std::string &name, float x, float y, float z) const
{
	glUniform3f(glGetUniformLocation(mID, name.c_str()), x, y, z);
}

void Shader::setVec4(const std::string &name, const glm::vec4 &value) const
{
	glUniform4fv(glGetUniformLocation(mID, name.c_str()), 1, &value[0]);
}

void Shader::setVec4(const std::string &name, float x, float y, float z, float w) const
{
	glUniform4f(glGetUniformLocation(mID, name.c_str()), x, y, z, w);
}

void Shader::setMat2(const std::string &name, const glm::mat2 &mat) const
{
	glUniformMatrix2fv(glGetUniformLocation(mID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
}

void Shader::setMat3(const std::string &name, const glm::mat3 &mat) const
{
	glUniformMatrix3fv(glGetUniformLocation(mID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
}

void Shader::setMat4(const std::string &name, const glm::mat4 &mat) const
{
	glUniformMatrix4fv(glGetUniformLocation(mID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
}

// activate the shader
void Shader::use()
{
	glUseProgram(mID);
}

Shader::~Shader()
{

}