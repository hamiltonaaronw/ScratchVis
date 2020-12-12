#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uTime;
uniform vec2 uRes;
uniform float[256] uSpectrum;

out vec4 retColor;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

mat2 rot(float a)
{
	return mat2(
		cos(a), -sin(a),
		sin(a), cos(a)
	);
}

vec3 col(vec2 p)
{
	vec3 ret;

	vec2 q;
	q = p;
	//q = (2.0 * gl_FragCoord.xy - uRes) / uRes.y;
	q /= (3.6 - sin(mod(3.6, uFreq)));

	vec3 c = vec3(0.0);
	vec3 rd = vec3(q, -1.0);

	float s = 0.5;
	for (int i = 0; i < 8; i++)
	{
		rd = abs(rd) / dot(rd, rd);
		rd -= s;
		rd.xy *= rot(0.0 + uTime * 0.11);
		rd.xz *= rot(0.0 - uTime * 0.231);
		rd.zy *= rot(0.3 + uTime * 0.131);

		s *= 0.8;

		float b = 0.005;
		c.gb += 0.014 / max(abs(rd.x * 0.8), abs(rd.y * 0.8));
		c.rb += 0.015 / max(abs(rd.y * 0.6), abs(rd.z * 0.6));
		c.rg += 0.01 / max(abs(rd.x), abs(rd.z));;
	}

	c *= 0.4;

	//ret = vec3(1.0, 0.0, 0.0);
	//ret = vec3(0.0, 1.0, 0.0);
	//ret = vec3(0.0, 0.0, 1.0);

	ret = vec3(c);

	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv;
	
	uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;
	//uv = gl_FragCoord.xy / uRes.xy - 0.5;

	ret = vec4(col(uv), 1.0);
	//ret = col(uv);
	retColor = ret;
}
