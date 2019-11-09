#include "ShaderManager.h"

ShaderManager::ShaderManager()
{
	init();
}

void ShaderManager::addShader(ShaderProgram p, ShaderInfo *s)
{
	std::ifstream fV(s->mVertPath),
		fF(s->mFragPath);

	std::string badPath = "";

	if (!fV.good())
	{
		std::cout << "Failed to load shader program " << s->mName
			<< std::endl << "Filepath " << s->mVertPath << " is invalid\n";
		return;
	}
	if (!fF.good())
	{
		std::cout << "Failed to load shader program " << s->mName
			<< std::endl << "Filepath " << s->mFragPath << " is invalid\n";
		return;
	}
	if (s->mGeomPath != NULL)
	{
		std::ifstream fG(s->mGeomPath);
		if (!fG.good())
		{
			std::cout << "Failed to load shader program " << s->mName
				<< std::endl << "Filepath " << s->mGeomPath << " is invalid\n";
			return;
		}
	}
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
	this->addShader(ShaderProgram::PSYCH,				new ShaderInfo("Psychedelicious",	0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/tunnel.frag",			NULL));
	this->addShader(ShaderProgram::RETRO,				new ShaderInfo("Retro",				0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/vintage.frag",		NULL));
	this->addShader(ShaderProgram::DISCO,				new ShaderInfo("DiscoTHICC",		0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/disco.frag",			NULL));
	this->addShader(ShaderProgram::EYE,					new ShaderInfo("Eye",				0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/eye.frag",			NULL));
	this->addShader(ShaderProgram::LIGHTS,				new ShaderInfo("Lightshow",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/lightshow.frag",		NULL));
	this->addShader(ShaderProgram::ECLIPSE,				new ShaderInfo("Eclipse",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/eclipse.frag",		NULL));
	this->addShader(ShaderProgram::FRACTID,				new ShaderInfo("Fractid",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/fractid.frag",		NULL));
	this->addShader(ShaderProgram::SMOKE,				new ShaderInfo("Smoke",				0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/smoke.frag",			NULL));
	this->addShader(ShaderProgram::FLOWER,				new ShaderInfo("Flowers",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/flowers.frag",		NULL));
	this->addShader(ShaderProgram::LIGHTNING,			new ShaderInfo("Lightning",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/lightning.frag",		NULL));
	this->addShader(ShaderProgram::PINNEAL,				new ShaderInfo("Pinneal",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/pinneal.frag",		NULL));
	this->addShader(ShaderProgram::SPACE_STATION,		new ShaderInfo("Space Station",		0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/space.frag",			NULL));
	this->addShader(ShaderProgram::TAPESTRY,			new ShaderInfo("Tapestry",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/tapestry.frag",		NULL));
	this->addShader(ShaderProgram::INFINITY_,			new ShaderInfo("Infinity",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/infinity.frag",		NULL));
	this->addShader(ShaderProgram::PILLARS,				new ShaderInfo("Pillars",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/pillars.frag",		NULL));
	this->addShader(ShaderProgram::TRIANGLES,			new ShaderInfo("Triangles",			0,	0,	0, "Shaders/Vertex/basic.vert", "Shaders/Fragment/triangles.frag",		NULL));

	this->setNumShaders(mShaders.size());
	this->setCurProg(mShaders.begin()->first);
}

void ShaderManager::reloadShader()
{
	this->toggleShader(0);
}

void ShaderManager::toggleShader(int prevNext)
{
	int i = 0 + (int)mCurProg + prevNext;

	int cProg = (i < 0) ? mShaders.size() - 1 : i % mShaders.size();
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