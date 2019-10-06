#include "ShaderManager.h"

ShaderManager::ShaderManager()
{
	init();
}

void ShaderManager::addShader(ShaderProgram p, ShaderInfo *s)
{
	mShaders.insert(std::pair<ShaderProgram, ShaderInfo*>(p, s));
}

void ShaderManager::clean()
{
	for (auto it = mShaders.begin(); it != mShaders.end(); it++)
	{
		it->second = NULL;
		delete it->second;
	}
	mShaders.clear();
}

void ShaderManager::init()
{
	this->addShader(ShaderProgram::PSYCH,		new ShaderInfo("Psychedelicious",	0,	0,	0, "Shaders/Vertex/basic_vert.vs", "Shaders/Fragment/tunnel_frag.fs",		NULL));
	this->addShader(ShaderProgram::RETRO,		new ShaderInfo("Retro",				0,	0,	0, "Shaders/Vertex/basic_vert.vs", "Shaders/Fragment/vintage_frag.fs",		NULL));
	this->addShader(ShaderProgram::DISCO,		new ShaderInfo("DiscoTHICC",		0,	0,	0, "Shaders/Vertex/basic_vert.vs", "Shaders/Fragment/disco_thicc_frag.fs",	NULL));
	this->addShader(ShaderProgram::EYE,			new ShaderInfo("Eye",				0,	0,	0, "Shaders/Vertex/basic_vert.vs", "Shaders/Fragment/eye_frag.fs",			NULL));
	this->addShader(ShaderProgram::LIGHTS,		new ShaderInfo("Lightshow",			0,	0,	0, "Shaders/Vertex/basic_vert.vs", "Shaders/Fragment/lightshow_frag.fs",	NULL));
	this->addShader(ShaderProgram::ECLIPSE,		new ShaderInfo("Eclipse",			0,	0,	0, "Shaders/Vertex/basic_vert.vs", "Shaders/Fragment/eclipse_frag.fs",		NULL));
	this->addShader(ShaderProgram::FRACTID,		new ShaderInfo("Fractid",			0,	0,	0, "Shaders/Vertex/basic_vert.vs", "Shaders/Fragment/fractid_frag.fs",		NULL));

	this->setNumShaders(mShaders.size());
	this->setCurProg(mShaders.begin()->first);
}

void ShaderManager::reloadShader()
{
	this->toggleShader(0);
}

void ShaderManager::toggleShader(int prevNext)
{
	int cProg = ((int)mCurProg + prevNext) % mShaders.size();
	this->setCurProg((ShaderProgram)cProg);

	ShaderInfo *pTmp = mShaders.find(mCurProg)->second;

	if (mpCurShader)
		glDeleteProgram(mpCurShader->getID());

	this->unloadCurShader();

	mpCurShader = new Shader(pTmp->mName, pTmp->mVID, pTmp->mFID, pTmp->mGID, pTmp->mVertPath, pTmp->mFragPath, pTmp->mGeomPath);
}

void ShaderManager::unloadCurShader()
{
	mpCurShader = NULL;
	delete mpCurShader;
}

void ShaderManager::use()
{
	if (!mpCurShader)
		toggleShader(0);

	mpCurShader->use();
}

ShaderManager::~ShaderManager()
{
	clean();
}