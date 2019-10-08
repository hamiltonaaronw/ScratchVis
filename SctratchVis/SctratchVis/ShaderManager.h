#pragma once

#include "Shaders/Shader.h"

#include <map>

enum ShaderProgram
{
	PSYCH,
	RETRO,
	DISCO,
	EYE,
	LIGHTS,
	ECLIPSE,
	FRACTID,
	SMOKE,
	FLOWER,
	LIGHTNING,
	MISC
};

struct ShaderInfo
{
	const char*			mName;
	unsigned int		mVID;
	unsigned int		mFID;
	unsigned int		mGID;
	const char*			mVertPath;
	const char*			mFragPath;
	const char*			mGeomPath;

	ShaderInfo(const char* n, unsigned int vi, unsigned int fi, unsigned int gi, const char* vp, const char* fp, const char* gp)
		: mName(n),
		mVID(vi), mFID(fi), mGID(gi),
		mVertPath(vp), mFragPath(fp), mGeomPath(gp)
	{}
};

class ShaderManager
{
private:
	// functions
	void clean();
	void init();
	void unloadCurShader();

	// variables
	std::map<ShaderProgram, ShaderInfo*> mShaders;

	Shader *mpCurShader;
	ShaderProgram mCurProg;

	int mNumShaders;

public:
	// constructor/destructor
	ShaderManager();
	~ShaderManager();

	// getters/setters
	Shader*			getCurrentShader()	{ return mpCurShader; };

	void			setCurProg(ShaderProgram p) { mCurProg = p; };
	ShaderProgram	getCurProgram()				{ return mCurProg; };

	void setNumShaders(int s)	{ mNumShaders = s; ; }
	int getNumShaders()			{ return mNumShaders; };

	std::string getCurShaderName() { return mpCurShader->getProgramName(); };
	std::string getShaderName(ShaderProgram p) { return mShaders.find(p)->second->mName; };

	// functions
	void addShader(ShaderProgram p, ShaderInfo *s);
	void reloadShader();
	void toggleShader(int prevNext);
	void use();
};
